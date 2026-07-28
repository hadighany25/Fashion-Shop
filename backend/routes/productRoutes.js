const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ទាញយក Middleware ទាំង២ ដែលបងបានរៀបចំអម្បាញ់មិញមកប្រើ
const {
  verifyToken,
  isSellerOrAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES (សម្រាប់អ្នកទិញទូទៅ មិនបាច់ Login ក៏មើលបាន)
// ==========================================
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// ==========================================
// PROTECTED ROUTES (សម្រាប់តែ Seller ឬ Admin ប៉ុណ្ណោះ)
// ==========================================
// រាល់ការ Add, Edit, ឬ Delete ត្រូវតែឆ្លងកាត់អ្នកយាមទ្វារទាំង២នេះសិន
router.post("/", verifyToken, isSellerOrAdmin, productController.addProduct);
router.put(
  "/:id",
  verifyToken,
  isSellerOrAdmin,
  productController.updateProduct,
);
router.delete(
  "/:id",
  verifyToken,
  isSellerOrAdmin,
  productController.deleteProduct,
);

module.exports = router;
