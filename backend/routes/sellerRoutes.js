const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");
const { verifyToken } = require("../middlewares/auth");

// ==========================================
// Profile & Settings
// ==========================================
router.get("/profile", sellerController.getProfile);
router.put("/profile", sellerController.updateProfile);
router.put("/change-password", sellerController.changePassword);

// ==========================================
// Categories
// ==========================================
router.get("/categories", sellerController.getCategories);
router.post("/categories", sellerController.createCategory);

// ==========================================
// Products
// ==========================================
router.get("/products", sellerController.getProducts);
router.post("/products", sellerController.createProduct);
router.delete("/products/:id", sellerController.deleteProduct);

// ==========================================
// Orders
// ==========================================
router.get("/orders", sellerController.getOrders);
router.put("/orders/:id/status", sellerController.updateOrderStatus);

module.exports = router;
