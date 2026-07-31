const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order"); // ហៅ Order Model មកប្រើ

const UPAY_MERCHANT_ID = process.env.UPAY_MERCHANT_ID;
const UPAY_API_KEY = process.env.UPAY_API_KEY;
const UPAY_API_SECRET = process.env.UPAY_API_SECRET;
const UPAY_BASE_URL = process.env.UPAY_BASE_URL;

// សូមប្រាកដថាបងមានដាក់ WEBHOOK_URL ក្នុង .env ឧ. https://ឈ្មោះ-app-បង.fly.dev/api/payment/webhook
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://your-domain.fly.dev/api/payment/webhook";

// ១. មុខងារស្នើសុំ QR / Deep Link ពី U-Pay
exports.createPaymentQR = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    if (!orderId || !amount) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ព័ត៌មានមិនគ្រប់គ្រាន់ (ត្រូវការ orderId និង amount)",
        });
    }

    // ១.១. កំណត់ទម្រង់លុយឲ្យបានត្រឹមត្រូវ (ឧទាហរណ៍៖ បើ 1 ត្រូវបំប្លែងទៅជា 1.00)
    const formattedAmount = parseFloat(amount).toFixed(2);

    // ១.២. រៀបចំទិន្នន័យសម្រាប់បាញ់ទៅ U-Pay
    const payload = {
      merchantId: UPAY_MERCHANT_ID,
      orderId: orderId,
      amount: formattedAmount,
      currency: "USD",
      description: orderInfo || "ទូទាត់ទំនិញនៅលើ U-Mall",
      notifyUrl: WEBHOOK_URL, // នេះហើយជាកន្លែងប្រាប់ U-Pay ថាយើងនៅឯណា
      timestamp: Date.now(),
    };

    // ១.៣. បង្កើតសោរសម្ងាត់ (Signature)
    const rawString = `${payload.merchantId}${payload.orderId}${payload.amount}${UPAY_API_SECRET}`;
    payload.sign = crypto.createHash("sha256").update(rawString).digest("hex");

    const config = {
      headers: { Authorization: `Bearer ${UPAY_API_KEY}` },
    };

    console.log("=== 1. SENDING TO U-PAY ===", payload); // Print មើលតើទិន្នន័យខុសកន្លែងណាឬអត់

    // ១.៤. ហៅ API ទៅកាន់ U-Pay
    const upayResponse = await axios.post(
      `${UPAY_BASE_URL}/create_order`,
      payload,
      config,
    );

    console.log("=== 2. U-PAY RESPONSE ===", upayResponse.data); // Print មើលចម្លើយពី U-Pay វិញ

    // ១.៥. ឆែកមើលលទ្ធផល
    if (upayResponse.data && upayResponse.data.code === "SUCCESS") {
      return res.json({
        success: true,
        qrData: upayResponse.data.qrCodeData, // យក Link ឬ ទិន្នន័យ QR ពី U-Pay
        deepLink: upayResponse.data.deepLink,
        message: "បង្កើត QR ជោគជ័យ",
      });
    } else {
      // បើបរាជ័យ វាមាន Error Message បោះមកប្រាប់បងនៅត្រង់នេះហើយ
      return res.status(400).json({
        success: false,
        message: "បរាជ័យក្នុងការស្នើសុំ U-Pay QR",
        upayMessage: upayResponse.data.msg || "Unknown Error",
        upayError: upayResponse.data,
      });
    }
  } catch (error) {
    console.error(
      "=== ERROR IN createPaymentQR ===",
      error.response ? error.response.data : error.message,
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Server Error មិនអាចទាក់ទងទៅ U-Pay បានទេ",
      });
  }
};

// ២. មុខងារ Webhook សម្រាប់ទទួលដំណឹងពី U-Pay ពេលភ្ញៀវបង់លុយរួច
exports.upayWebhook = async (req, res) => {
  try {
    console.log("=== 3. WEBHOOK RECEIVED ===", req.body); // Print មើលពេល U-Pay បាញ់ចូល

    const { orderId, amount, status, sign, transactionId } = req.body;

    // ២.១. ផ្ទៀងផ្ទាត់សោរសម្ងាត់ការពារការបន្លំ
    const rawString = `${orderId}${amount}${status}${UPAY_API_SECRET}`;
    const expectedSignature = crypto
      .createHash("sha256")
      .update(rawString)
      .digest("hex");

    if (sign !== expectedSignature) {
      console.warn("⚠️ ជនខិលខូចព្យាយាមបន្លំ Webhook! Signature ខុសគ្នា");
      return res.status(403).send("Invalid Signature");
    }

    // ២.២. បើ Status ជោគជ័យ យើង Update ក្នុង Database
    if (status === "SUCCESS" || status === "PAID") {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: orderId },
        {
          paymentStatus: "PAID",
          upayTransactionId: transactionId || null,
          paidAt: new Date(),
        },
        { new: true },
      );

      if (updatedOrder) {
        console.log(
          `✅ Webhook: Update ជោគជ័យ! លុយបានចូលហើយសម្រាប់ Order: ${orderId}`,
        );
      } else {
        console.warn(
          `⚠️ Webhook: ទទួលបានលុយ តែរកអត់ឃើញ Order ID ${orderId} ក្នុង Database ទេ`,
        );
      }
    }

    // ២.៣. បោះសារទៅ U-Pay វិញថាទទួលបានហើយ (កុំឱ្យវាបាញ់មកទៀត)
    res.status(200).send("SUCCESS");
  } catch (error) {
    console.error("Error in Webhook:", error);
    res.status(500).send("Server Error");
  }
};

// ៣. មុខងារអោយ Frontend ឆែកមើល Status ពេលកំពុងរង់ចាំភ្ញៀវស្កេន
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ស្វែងរកវិក័យប័ត្រក្នុង Database
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក័យប័ត្រនេះទេ" });
    }

    // បោះ Status ទៅឲ្យ Frontend
    return res.json({
      success: true,
      status: order.paymentStatus, // វានឹងចេញ 'PENDING' ឬ 'PAID'
    });
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    res.status(500).json({ success: false, error: "Error checking status" });
  }
};
