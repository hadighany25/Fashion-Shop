const Order = require("../models/Order");
const crypto = require("crypto");
const axios = require("axios");

// ១. មុខងារសម្រាប់ស្នើសុំ QR Code ពី U-Pay Bank (General API)
const createUPayQR = async (req, res) => {
  try {
    // 🌟 ចាប់យក amount ពី Frontend (បើមាន)
    const { orderId, amount: frontendAmount } = req.body;

    // 🌟 ប្រើ .find() ជំនួស .findOne() ដើម្បីទាញយក Order គ្រប់ហាងទាំងអស់ដែលមាន orderId ដូចគ្នា
    const orders = await Order.find({ orderId });
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ!" });
    }

    // ទាញយកកូដសម្ងាត់ពី Fly.io Secrets
    const merchantId = process.env.UPAY_MERCHANT_ID;
    const apiKey = process.env.UPAY_API_KEY;
    const apiSecret = process.env.UPAY_API_SECRET;
    const baseUrl = process.env.UPAY_BASE_URL;

    // 🌟 គណនាតម្លៃសរុបពិតប្រាកដ
    let finalAmount = frontendAmount;

    // បើ Frontend អត់មានបោះតម្លៃមកទេ ត្រូវបូកសរុបតម្លៃ Order គ្រប់ហាងដោយស្វ័យប្រវត្តិ
    if (!finalAmount) {
      const subTotal = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
      finalAmount = subTotal + 1.5; // បូក 1.5 ថ្លៃដឹកជញ្ជូន
    }

    // រៀបចំទិន្នន័យផ្ញើទៅ U-Pay
    const amount = Number(finalAmount).toFixed(2); // ធានាថាចេញ $9.00
    const remark = `ទូទាត់សម្រាប់វិក័យប័ត្រលេខ: ${orderId}`;
    const reqTime = Date.now().toString();

    // បង្កើតសោរសម្ងាត់ (Signature)
    const rawSignature = `${merchantId}${orderId}${amount}${apiKey}${reqTime}`;
    const hashSignature = crypto
      .createHmac("sha256", apiSecret)
      .update(rawSignature)
      .digest("hex");

    // បាញ់ទិន្នន័យទៅកាន់ U-Pay API
    const response = await axios.post(
      `${baseUrl}/api/merchants/qr/create`,
      {
        merchant_id: merchantId,
        order_id: orderId,
        amount: amount,
        remark: remark,
        notify_url: "https://fashion-shop-kh.fly.dev/api/payment/webhook",
        req_time: reqTime,
        sign: hashSignature,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (response.data && response.data.code === "SUCCESS") {
      res.status(200).json({
        success: true,
        qrData: response.data.data.qr_code_data,
        deepLink: response.data.data.deeplink,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "ធនាគារបដិសេធសំណើ",
        error: response.data,
      });
    }
  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    console.error("❌ Error creating U-Pay QR:", errorMsg);
    res.status(500).json({
      success: false,
      message: "បញ្ហាបច្ចេកទេសតភ្ជាប់ទៅធនាគារ U-Pay",
      detail: errorMsg,
    });
  }
};

// ២. មុខងារសម្រាប់ចាំទទួលដំណឹង (Webhook) ពី U-Pay ពេលអតិថិជនទូទាត់ជោគជ័យ
const handleWebhook = async (req, res) => {
  try {
    const { orderId, amount, status, upayTransactionId } = req.body;

    // 🌟 ប្រើ updateMany ដើម្បីអាប់ដេត Order របស់គ្រប់ហាងទាំងអស់ដែលមាន orderId នេះទៅជា PAID
    const result = await Order.updateMany(
      { orderId: orderId },
      {
        $set: {
          paymentStatus: status || "PAID",
          upayTransactionId: upayTransactionId,
          paidAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Webhook received and all orders updated successfully",
      });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ៣. មុខងារសម្រាប់ Frontend ឆែកមើលស្ថានភាពលុយ (Polling) រៀងរាល់ ៣ វិនាទីម្តង
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ឆែកមើលតែ ១ គឺគ្រប់គ្រាន់ ព្រោះ Webhook បាន Update ទាំងអស់ព្រមគ្នារួចហើយ
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

    // បោះស្ថានភាពបច្ចុប្បន្ន (PENDING ឬ PAID) ទៅឲ្យ Frontend
    res.status(200).json({
      success: true,
      status: order.paymentStatus,
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស" });
  }
};

// ✅ រៀបចំ Export មុខងារទាំងបីរួមគ្នាតែម្តង
module.exports = { createUPayQR, handleWebhook, checkOrderStatus };
