const express = require("express");
const router = express.Router();
const {
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/sellerController");
// 💡 ១. Import Middleware ដែលប្រើសម្រាប់ឆែក Token
const { verifyToken } = require("../middleware/authMiddleware");

const {
  createOrder,
  getMyOrders,
  confirmReceipt,
  submitReview,
  cancelOrder, // 👈 ១. ថែម Import មុខងារ cancelOrder ដែលទើបបង្កើត
} = require("../controllers/orderController");

// ផ្លូវចាស់: សម្រាប់កត់ត្រាវិក័យប័ត្រថ្មី (មិនប៉ះពាល់ការហៅពី Frontend ចាស់)
router.post("/create", createOrder);

// ផ្លូវថ្មី: សម្រាប់អតិថិជនគ្រប់គ្រងការបញ្ជាទិញ
router.get("/my-orders", verifyToken, getMyOrders);
router.put("/:id/confirm", verifyToken, confirmReceipt);
router.post("/:id/review", verifyToken, submitReview);

// =======================================================
// 📌 ផ្លូវថ្មីសម្រាប់ Seller (អ្នកលក់) ធ្វើការបោះបង់ Order
// =======================================================

router.put("/orders/:id/status", verifyToken, updateOrderStatus);

// ហៅពី Frontend: PUT /api/seller/orders/:id/cancel
router.put("/orders/:id/cancel", verifyToken, cancelOrder);

module.exports = router;
