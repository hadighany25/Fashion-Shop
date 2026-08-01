const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/orderController");

// នៅពេល Frontend ហៅ API មកកាន់ POST /api/orders/create វានឹងដំណើរការមុខងារ createOrder
router.post("/create", createOrder);

module.exports = router;
