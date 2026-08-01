const express = require("express");
const router = express.Router();
const {
  createUPayQR,
  handleWebhook,
  checkOrderStatus,
} = require("../controllers/paymentController");

// ១. ផ្លូវសម្រាប់ Frontend ហៅមកសុំ QR Code (POST /api/payment/create-qr)
router.post("/create-qr", createUPayQR);

// ២. ផ្លូវសម្រាប់ U-Pay បាញ់សារមកប្រាប់ថាលុយចូល (POST /api/payment/webhook)
router.post("/webhook", handleWebhook);

// ៣. ផ្លូវសម្រាប់ Frontend ឆែកមើលថាលុយចូលឬនៅ (GET /api/payment/orders/status/:orderId)
router.get("/orders/status/:orderId", checkOrderStatus);

module.exports = router;
