const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  verifyToken,
  isSeller,
  isStaff,
} = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");

// Middleware តូចមួយសម្រាប់ឆែកថា បើមាន Token គឺទាញយក User ID, បើអត់ Token ទេ ក៏ឱ្យឆ្លងកាត់ដែរ (សម្រាប់ Guest)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(
        token,
        process.env.JWT_SECRET || "FASHION_SHOP_SECRET_KEY",
      );
    } catch (error) {
      // អត់ខ្វល់បើ Token error, ចាត់ទុកថាជា Guest ចុះ
    }
  }
  next();
};

// ១. បញ្ជាទិញទំនិញ (ប្រើ optionalAuth ដើម្បីឱ្យ Guest ក៏អាចទិញបាន)
router.post("/", optionalAuth, orderController.createOrder);

// ២. អតិថិជនទាញយកប្រវត្តិទិញរបស់ខ្លួន (ត្រូវតែ Login)
router.get("/myorders", verifyToken, orderController.getMyOrders);

// ៣. អ្នកលក់ទាញយកការកុម្ម៉ង់ដែលពាក់ព័ន្ធនឹងហាងរបស់ខ្លួន (ត្រូវតែជា Seller)
router.get("/seller", verifyToken, isSeller, orderController.getSellerOrders);

// ៤. ផ្លាស់ប្តូរស្ថានភាពកុម្ម៉ង់ ពី Pending ទៅ Shipped ជាដើម (សម្រាប់បុគ្គលិកប៉ុណ្ណោះ)
router.put(
  "/:id/status",
  verifyToken,
  isStaff,
  orderController.updateOrderStatus,
);

module.exports = router;
