const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const verifyToken = require("../middleware/auth"); // ទាញយក Middleware របស់បងដែលប្រើសម្រាប់ឆែក Token

// ==========================================
// 1. Profile & Settings Routes
// ==========================================
router.get("/profile", verifyToken, sellerController.getProfile);
router.put("/profile", verifyToken, sellerController.updateProfile);
router.put("/change-password", verifyToken, sellerController.changePassword);

// ==========================================
// 2. Orders Routes (គ្រប់គ្រងការបញ្ជាទិញ)
// ==========================================
router.get("/orders", verifyToken, sellerController.getOrders);
router.put(
  "/orders/:id/status",
  verifyToken,
  sellerController.updateOrderStatus,
);

// ==========================================
// 3. Categories Routes (គ្រប់គ្រងប្រភេទចំណាត់ថ្នាក់)
// ==========================================
router.get("/categories", verifyToken, sellerController.getCategories);
router.post("/categories", verifyToken, sellerController.createCategory);

// ==========================================
// 4. Products Routes (គ្រប់គ្រងផលិតផល)
// ==========================================
router.get("/products", verifyToken, sellerController.getProducts);
router.post("/products", verifyToken, sellerController.createProduct);
router.delete("/products/:id", verifyToken, sellerController.deleteProduct);

module.exports = router;
