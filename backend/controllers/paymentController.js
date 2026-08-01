const Order = require("../models/Order");
const crypto = require("crypto");
const axios = require("axios"); // សូមប្រាកដថាបងបានវាយ command: npm install axios

// ១. មុខងារសម្រាប់ស្នើសុំ QR Code ពី U-Pay
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
    const baseUrl = process.env.UPAY_BASE_URL;

    // រៀបចំទិន្នន័យផ្ញើទៅ U-Pay
    const amount = order.totalAmount.toFixed(2);
    const remark = `ទូទាត់សម្រាប់វិក័យប័ត្រលេខ: ${orderId}`;
    const reqTime = Date.now().toString();

    // បង្កើតសោរសម្ងាត់ (Signature) តាមទម្រង់ U-Pay
    const rawSignature = `${merchantId}${orderId}${amount}${apiKey}${reqTime}`;
    const hashSignature = crypto
      .createHmac("sha256", apiSecret)
      .update(rawSignature)
      .digest("hex");

    // បាញ់ទិន្នន័យទៅកាន់ U-Pay API
    const response = await axios.post(
      `${baseUrl}/api/v1/merchant/qr/create`,
      {
        merchant_id: merchantId,
        order_id: orderId,
        amount: amount,
        remark: remark,
        notify_url: "https://fashion-shop-kh.fly.dev/api/payment/webhook", // URL ពិតប្រាកដសម្រាប់ទទួល Webhook
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
      res
        .status(400)
        .json({
          success: false,
          message: "មិនអាចបង្កើត QR ពី U-Pay បានទេ",
          error: response.data,
        });
    }
  } catch (error) {
    console.error("Error creating U-Pay QR:", error);
    res
      .status(500)
      .json({ success: false, message: "បញ្ហាបច្ចេកទេសក្នុង Server" });
  }
};

// ២. មុខងារសម្រាប់ចាំទទួលដំណឹង (Webhook) ពី U-Pay ពេលលុយចូល
const handleWebhook = async (req, res) => {
  try {
    const { order_id, status, tran_id } = req.body;
    console.log("🔔 ទទួលបាន Webhook ពី U-Pay:", req.body);

    if (status === "SUCCESS" || status === "PAID") {
      // កែប្រែស្ថានភាពពី PENDING ទៅជា PAID ក្នុង Database
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
        console.log(`✅ វិក័យប័ត្រលេខ ${order_id} ទទួលបានការទូទាត់ជោគជ័យ!`);
      }
    }

    // ឆ្លើយតបទៅ U-Pay វិញជានិច្ច (ដើម្បីបញ្ចប់ការបាញ់សាររបស់ U-Pay)
    res
      .status(200)
      .json({ code: "SUCCESS", message: "Webhook received and processed" });
  } catch (error) {
    console.error("❌ បញ្ហាក្នុងការទទួល Webhook:", error);
    res.status(500).json({ message: "Server processing error" });
  }
};

// ៣. មុខងារសម្រាប់ Frontend ឆែកមើលស្ថានភាពលុយ (Polling)
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ទាញយកស្ថានភាព Order ពី Database ពិតប្រាកដ
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

    res.status(200).json({
      success: true,
      status: order.paymentStatus, // វានឹងបោះពាក្យ PENDING ឬ PAID ទៅឲ្យ Frontend
    });
  } catch (error) {
    console.error("Error checking order status:", error);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស" });
  }
};

module.exports = { createUPayQR, handleWebhook, checkOrderStatus };
