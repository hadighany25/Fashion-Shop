const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  confirmReceipt,
  submitReview,
} = require("../controllers/orderController");

// ផ្លូវចាស់: សម្រាប់កត់ត្រាវិក័យប័ត្រថ្មី (មិនប៉ះពាល់ការហៅពី Frontend ចាស់)
router.post("/create", createOrder);

// ផ្លូវថ្មី: សម្រាប់អតិថិជនគ្រប់គ្រងការបញ្ជាទិញ
router.get("/my-orders", getMyOrders);
router.put("/:id/confirm", confirmReceipt);
router.post("/:id/review", submitReview);

module.exports = router;
