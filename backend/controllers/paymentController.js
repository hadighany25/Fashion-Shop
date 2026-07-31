const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");

const UPAY_MERCHANT_ID = process.env.UPAY_MERCHANT_ID;
const UPAY_API_KEY = process.env.UPAY_API_KEY;
const UPAY_API_SECRET = process.env.UPAY_API_SECRET;
const UPAY_BASE_URL = process.env.UPAY_BASE_URL;

// ១. មុខងារស្នើសុំ QR / Deep Link ពី U-Pay
exports.createPaymentQR = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    if (!orderId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "ព័ត៌មានមិនគ្រប់គ្រាន់" });
    }

    const payload = {
      merchantId: UPAY_MERCHANT_ID,
      orderId: orderId,
      amount: parseFloat(amount).toFixed(2),
      currency: "USD",
      description: orderInfo || "ទូទាត់ទំនិញនៅលើ U-Mall",
      notifyUrl:
        process.env.WEBHOOK_URL ||
        "https://your-domain.com/api/payment/webhook", // អាចប្រើ Ngrok url ពេល test
      timestamp: Date.now(),
    };

    const rawString = `${payload.merchantId}${payload.orderId}${payload.amount}${UPAY_API_SECRET}`;
    payload.sign = crypto.createHash("sha256").update(rawString).digest("hex");

    const config = {
      headers: { Authorization: `Bearer ${UPAY_API_KEY}` },
    };

    const upayResponse = await axios.post(
      `${UPAY_BASE_URL}/create_order`,
      payload,
      config,
    );

    if (upayResponse.data && upayResponse.data.code === "SUCCESS") {
      return res.json({
        success: true,
        qrData: upayResponse.data.qrCodeData,
        deepLink: upayResponse.data.deepLink,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "បរាជ័យក្នុងការស្នើសុំ U-Pay QR" });
    }
  } catch (error) {
    console.error("Error in createPaymentQR:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ២. មុខងារ Webhook សម្រាប់ទទួលដំណឹងពី U-Pay
exports.upayWebhook = async (req, res) => {
  try {
    const { orderId, amount, status, sign } = req.body;

    const rawString = `${orderId}${amount}${status}${UPAY_API_SECRET}`;
    const expectedSignature = crypto
      .createHash("sha256")
      .update(rawString)
      .digest("hex");

    if (sign !== expectedSignature) {
      console.warn("⚠️ ជនខិលខូចព្យាយាមបន្លំ Webhook!");
      return res.status(403).send("Invalid Signature");
    }

    if (status === "SUCCESS" || status === "PAID") {
      // អាប់ដេតវិក័យប័ត្រក្នុង Database ទៅជា "បង់ប្រាក់រួច"
      // await Order.findOneAndUpdate({ orderId: orderId }, { status: 'PAID' });
      console.log(`✅ Webhook: លុយបានចូលហើយសម្រាប់ Order: ${orderId}`);
    }

    res.status(200).send("SUCCESS");
  } catch (error) {
    console.error("Error in Webhook:", error);
    res.status(500).send("Server Error");
  }
};

// ៣. មុខងារអោយ Frontend ឆែកមើល Status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    // const order = await Order.findOne({ orderId: orderId });

    // Mock data សម្រាប់ពេលតេស្ត
    const isPaid = false;

    if (isPaid) {
      return res.json({ status: "SUCCESS" });
    } else {
      return res.json({ status: "PENDING" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error checking status" });
  }
};
