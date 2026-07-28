const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, isSeller } = require("../middleware/authMiddleware");

// ១. ទាញទំនិញទាំងអស់មកបង្ហាញលើទំព័រដើម (Public - អ្នកណាក៏អាចមើលបាន មិនបាច់ Login)
router.get("/", productController.getAllProducts);

// ២. អ្នកលក់ទាញយកទំនិញក្នុងហាងរបស់ខ្លួនឯង (ត្រូវតែជា Seller ទើបអាចមើលបាន)
router.get(
  "/seller",
  verifyToken,
  isSeller,
  productController.getSellerProducts,
);

// ៣. អ្នកលក់បន្ថែមទំនិញថ្មីចូលហាង (ត្រូវតែជា Seller)
router.post("/", verifyToken, isSeller, productController.addProduct);

module.exports = router;
