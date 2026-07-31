const express = require("express");
const router = express.Router();

// ទាញយកមុខងារពី Controller មកប្រើ
const paymentController = require("../controllers/paymentController");

// កំណត់ផ្លូវ (Routes) នីមួយៗ
router.post("/create-qr", paymentController.createPaymentQR);
router.post("/webhook", paymentController.upayWebhook);
router.get("/orders/status/:orderId", paymentController.checkPaymentStatus);

module.exports = router;
