const Order = require("../models/Order");
const crypto = require("crypto");
const axios = require("axios");

// ១. មុខងារសម្រាប់ស្នើសុំ QR Code ពី U-Pay Bank (General API)
const createUPayQR = async (req, res) => {
  try {
    const { orderId } = req.body;

    // រកមើល Order ក្នុង Database សិន
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ!" });
    }

    // ទាញយកកូដសម្ងាត់ពី Fly.io Secrets
    const merchantId = process.env.UPAY_MERCHANT_ID;
    const apiKey = process.env.UPAY_API_KEY;
    const apiSecret = process.env.UPAY_API_SECRET;
    const baseUrl = process.env.UPAY_BASE_URL; // ឧទាហរណ៍: https://u-pay-bank.fly.dev

    // រៀបចំទិន្នន័យផ្ញើទៅ U-Pay
    const amount = order.totalAmount.toFixed(2);
    const remark = `ទូទាត់សម្រាប់វិក័យប័ត្រលេខ: ${orderId}`;
    const reqTime = Date.now().toString();

    // បង្កើតសោរសម្ងាត់ (Signature) តាមទម្រង់ U-Pay ដើម្បីសុវត្ថិភាព
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

    // ទទួលយក QR ហើយបោះទៅឲ្យ Frontend វិញ
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

    // ស្វែងរក Order ក្នុង Database របស់ Fashion Shop ហើយអាប់ដេតស្ថានភាព
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

    // អាប់ដេតស្ថានភាពទៅជា PAID
    order.paymentStatus = status || "PAID";
    order.upayTransactionId = upayTransactionId;
    order.paidAt = new Date();
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ៣. មុខងារសម្រាប់ Frontend ឆែកមើលស្ថានភាពលុយ (Polling) រៀងរាល់ ៣ វិនាទីម្តង
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
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

// ✅ រៀបចំ Export មុខងារទាំងបីរួមគ្នាតែម្តង ឲ្យត្រូវតាមស្តង់ដារ CommonJS
module.exports = { createUPayQR, handleWebhook, checkOrderStatus };
