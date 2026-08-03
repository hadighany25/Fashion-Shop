const express = require("express");
const router = express.Router();
const payoutController = require("../controllers/payoutController");

// ទាញយក Middleware ឲ្យត្រូវឈ្មោះពី authMiddleware.js របស់បង
const {
  verifyToken,
  isSeller,
  isAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// ផ្នែកអ្នកលក់ (Seller)
// ==========================================
// អ្នកលក់ស្នើសុំដកប្រាក់ (ទាមទារ Token និងសិទ្ធិជា Seller ប៉ុណ្ណោះ)
// យើងប្រើ Middleware ២ តៗគ្នា: ទី១ ឆែក Token, ទី២ ឆែកមើលតួនាទី
router.post(
  "/seller/withdraw",
  verifyToken,
  isSeller,
  payoutController.requestWithdrawal,
);

// ==========================================
// ផ្នែកអ្នកគ្រប់គ្រង (Admin)
// ==========================================
// Admin អនុម័តការដកប្រាក់ (ទាមទារ Token និងសិទ្ធិជា Admin ឬ Super Admin)
router.post(
  "/admin/withdrawals/:withdrawalId/approve",
  verifyToken,
  isAdmin,
  payoutController.approveWithdrawal,
);

module.exports = router;
