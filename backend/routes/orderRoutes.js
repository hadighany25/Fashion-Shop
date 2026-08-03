const express = require("express");
const router = express.Router();

// 💡 ១. Import Middleware ដែលប្រើសម្រាប់ឆែក Token
const { verifyToken } = require("../middleware/authMiddleware");

const {
  createOrder,
  getMyOrders,
  confirmReceipt,
  updateOrderStatus, // 👈 Import ចូល
  submitReview,
  cancelOrder, // 👈 កុំភ្លេច Import
} = require("../controllers/orderController");

// ផ្លូវចាស់: សម្រាប់កត់ត្រាវិក័យប័ត្រថ្មី (មិនប៉ះពាល់ការហៅពី Frontend ចាស់)
router.post("/create", createOrder);

// ផ្លូវថ្មី: សម្រាប់អតិថិជន និងអ្នកលក់គ្រប់គ្រងការបញ្ជាទិញ
router.get("/my-orders", verifyToken, getMyOrders);
router.put("/:id/confirm", verifyToken, confirmReceipt);
router.post("/:id/review", verifyToken, submitReview);

// 🚀 ផ្លូវថ្មីសម្រាប់ឱ្យអ្នកលក់ (Seller) Update Status
router.put("/:id/status", verifyToken, updateOrderStatus);
router.put("/:id/cancel", verifyToken, cancelOrder); // ទុកឱ្យមានផ្លូវ Cancel ផង

module.exports = router;
