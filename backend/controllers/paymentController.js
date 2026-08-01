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

    // បាញ់ទិន្នន័យទៅកាន់ U-Pay API (ប្រើប្រាស់ Route ថ្មីដែលបានកំណត់)
    const response = await axios.post(
      `${baseUrl}/api/merchants/qr/create`,
      {
        merchant_id: merchantId,
        order_id: orderId,
        amount: amount,
        remark: remark,
        notify_url: "https://fashion-shop-kh.fly.dev/api/payment/webhook", // ទីតាំងដែល U-Pay ត្រូវបាញ់សារប្រាប់ពេលលុយចូល
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
      // ករណីធនាគារបដិសេធ (ឧទាហរណ៍: គណនី Merchant ត្រូវជាប់គាំង)
      res.status(400).json({
        success: false,
        message: "ធនាគារបដិសេធសំណើ",
        error: response.data,
      });
    }
  } catch (error) {
    // ចាប់យក Error ពិតប្រាកដមកបង្ហាញ (ឧទាហរណ៍: ខុស Route, ខុស Signature)
    const errorMsg = error.response ? error.response.data : error.message;
    console.error("❌ Error creating U-Pay QR:", errorMsg);
    res.status(500).json({
      success: false,
      message: "បញ្ហាបច្ចេកទេសតភ្ជាប់ទៅធនាគារ U-Pay",
      detail: errorMsg, // បោះ Error លម្អិតនេះទៅឲ្យ Frontend ធ្វើការលោត Pop-up ប្រាប់អតិថិជន
    });
  }
};

// ២. មុខងារសម្រាប់ចាំទទួលដំណឹង (Webhook) ពី U-Pay ពេលអតិថិជនទូទាត់ជោគជ័យ
const handleWebhook = async (req, res) => {
  try {
    const { order_id, status, tran_id } = req.body;
    console.log("🔔 ទទួលបាន Webhook ពី U-Pay:", req.body);

    // ប្រសិនបើធនាគារបញ្ជាក់ថាទទួលបានប្រាក់ពិតមែន
    if (status === "SUCCESS" || status === "PAID") {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: order_id },
        {
          paymentStatus: "PAID",
          upayTransactionId: tran_id,
          paidAt: new Date(),
        },
        { new: true },
      );

      if (updatedOrder) {
        console.log(
          `✅ វិក័យប័ត្រលេខ ${order_id} ទទួលបានការទូទាត់ជោគជ័យ និងបានអាប់ដេតក្នុង Database!`,
        );
      }
    }

    // ត្រូវតែឆ្លើយតប HTTP 200 ទៅធនាគារវិញ ដើម្បីឲ្យធនាគារឈប់បាញ់ Webhook មកទៀត
    res
      .status(200)
      .json({ code: "SUCCESS", message: "Webhook received and processed" });
  } catch (error) {
    console.error("❌ បញ្ហាក្នុងការទទួល Webhook:", error);
    res.status(500).json({ message: "Server processing error" });
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

module.exports = { createUPayQR, handleWebhook, checkOrderStatus };
