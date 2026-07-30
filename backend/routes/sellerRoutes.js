const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController");

// កែបន្ទាត់នេះឱ្យត្រូវនឹងឈ្មោះ Folder និង File របស់បង
const { verifyToken } = require("../middleware/authMiddleware");

// បើកដំណើរការ Middleware នេះ ដើម្បីការពាររាល់ការហៅ API ទាំងអស់របស់ Seller
router.use(verifyToken);

// ==========================================
// Profile & Settings
// ==========================================
router.get("/profile", sellerController.getProfile);
router.put("/profile", sellerController.updateProfile);
router.put("/change-password", sellerController.changePassword);

// ==========================================
// Products
// ==========================================
router.get("/products", sellerController.getProducts);
router.post("/products", sellerController.createProduct);
router.put("/products/:id", sellerController.updateProduct); // ✅ នេះគឺជាខ្សែដែលយើងត្រូវបន្ថែមសម្រាប់ Edit
router.delete("/products/:id", sellerController.deleteProduct);

// ==========================================
// Orders
// ==========================================
router.get("/orders", sellerController.getOrders);
router.put("/orders/:id/status", sellerController.updateOrderStatus);

module.exports = router;
