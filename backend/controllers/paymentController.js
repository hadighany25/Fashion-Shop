const Order = require("../models/Order");
const crypto = require("crypto");
const axios = require("axios");

// ============================================================================
// ១. មុខងារសម្រាប់ស្នើសុំ QR Code ពី U-Pay Bank
// ============================================================================
const createUPayQR = async (req, res) => {
  try {
    const { orderId, amount: frontendAmount } = req.body;

    // 🌟 កែតម្រូវទី១៖ ប្រើ Regex ដើម្បីចាប់យក Order គ្រប់ហាងទាំងអស់ (ORD-123456, ORD-123456-1, -2...)
    // ការពារកុំឱ្យវាច្រឡំជាមួយ ORD-1234567 ដោយប្រើ (?:-|$)
    const orderIdRegex = new RegExp("^" + orderId + "(?:-|$)");

    const orders = await Order.find({ orderId: orderIdRegex });
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ!" });
    }

    const merchantId = process.env.UPAY_MERCHANT_ID;
    const apiKey = process.env.UPAY_API_KEY;
    const apiSecret = process.env.UPAY_API_SECRET;
    const baseUrl = process.env.UPAY_BASE_URL;

    let finalAmount = frontendAmount;

    // បើ Frontend អត់មានបោះតម្លៃមកទេ ត្រូវបូកសរុបតម្លៃ Order គ្រប់ហាងដោយស្វ័យប្រវត្តិ
    if (!finalAmount) {
      const subTotal = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
      finalAmount = subTotal + 1.5; // បូក 1.5 ថ្លៃដឹកជញ្ជូន
    }

    const amount = Number(finalAmount).toFixed(2);
    const remark = `ទូទាត់សម្រាប់វិក័យប័ត្រលេខ: ${orderId}`;
    const reqTime = Date.now().toString();

    const rawSignature = `${merchantId}${orderId}${amount}${apiKey}${reqTime}`;
    const hashSignature = crypto
      .createHmac("sha256", apiSecret)
      .update(rawSignature)
      .digest("hex");

    const response = await axios.post(
      `${baseUrl}/api/merchants/qr/create`,
      {
        merchant_id: merchantId,
        order_id: orderId, // បញ្ជូនលេខមេទៅកាន់ U-Pay
        amount: amount,
        remark: remark,
        notify_url: "https://fashion-shop-kh.fly.dev/api/payment/webhook",
        req_time: reqTime,
        sign: hashSignature,
      },
      { headers: { "Content-Type": "application/json" } },
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

// ============================================================================
// ២. មុខងារ Webhook ទទួលដំណឹងពីធនាគារ
// ============================================================================
const handleWebhook = async (req, res) => {
  try {
    const { orderId, amount, status, upayTransactionId } = req.body;

    // 🌟 កែតម្រូវទី២៖ ប្រើ Regex UpdateMany ដើម្បីប្រាប់ឱ្យ Database អាប់ដេតគ្រប់ហាងទាំងអស់ដែលនៅក្រោមលេខមេនេះ
    const orderIdRegex = new RegExp("^" + orderId + "(?:-|$)");

    const result = await Order.updateMany(
      { orderId: orderIdRegex },
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

    res.status(200).json({
      success: true,
      message:
        "Webhook received and all multi-store orders updated successfully",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ============================================================================
// ៣. មុខងារ Polling ឆែកស្ថានភាពលុយ
// ============================================================================
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 🌟 កែតម្រូវទី៣៖ ឆែករកមើលយ៉ាងហោចណាស់ Order ១ ដែលមានលេខមេនេះ ដើម្បីដឹងថា PAID ឬនៅ
    const orderIdRegex = new RegExp("^" + orderId + "(?:-|$)");
    const order = await Order.findOne({ orderId: orderIdRegex });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

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
