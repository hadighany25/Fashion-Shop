const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// ទាញយក Middleware មកប្រើ ដើម្បីទប់សិទ្ធិ
const {
  verifyToken,
  isSellerOrAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// BUYER ROUTES (សម្រាប់អ្នកទិញ)
// ត្រូវតែ Login (verifyToken) ទើបអាចទិញ ឬមើលប្រវត្តិបាន
// ==========================================

// ១. បង្កើតការបញ្ជាទិញថ្មី (Checkout)
router.post("/", verifyToken, orderController.createOrder);

// ២. មើលប្រវត្តិបញ្ជាទិញរបស់ខ្លួនឯង (Order History)
router.get("/history", verifyToken, orderController.getUserOrders);

// ៣. ឆែកស្ថានភាពវិក្កយបត្រ (សម្រាប់ដំណើរការភ្ជាប់ Upay ពេលក្រោយ)
// (ដាក់ Public សិនក៏បាន ព្រោះ Frontend ឆែកវា Auto តាមរយៈ ID)
router.get("/check-status/:id", orderController.checkOrderStatus);

// ==========================================
// SELLER / ADMIN ROUTES (សម្រាប់អ្នកលក់គ្រប់គ្រង)
// ត្រូវមាន Token ផង និងមាន Role ជា Seller/Admin ផង
// ==========================================

// ៤. ទាញយកការបញ្ជាទិញទាំងអស់ (មើលវិក្កយបត្រភ្ញៀវទាំងអស់)
router.get("/", verifyToken, isSellerOrAdmin, orderController.getAllOrders);

// ៥. កែប្រែស្ថានភាពវិក្កយបត្រ (ឧ. ប្តូរពី Pending ទៅ Success ឬ Cancelled)
router.put(
  "/:id/status",
  verifyToken,
  isSellerOrAdmin,
  orderController.updateOrderStatus,
);

module.exports = router;
