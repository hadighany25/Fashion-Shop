const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/orderController");

// ផ្លូវសម្រាប់កត់ត្រាវិក័យប័ត្រថ្មី (POST /api/orders/create)
router.post("/create", createOrder);

module.exports = router;
