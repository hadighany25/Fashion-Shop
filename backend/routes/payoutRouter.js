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
// ផ្លូវសម្រាប់ស្នើសុំដកប្រាក់ (មានស្រាប់)
router.post(
  "/seller/withdraw",
  verifyToken,
  isSeller,
  payoutController.requestWithdrawal,
);

// 🚀 ផ្លូវថ្មីសម្រាប់ទាញយកប្រវត្តិដកប្រាក់មកបង្ហាញលើតារាង
router.get(
  "/seller/withdrawals",
  verifyToken,
  isSeller,
  payoutController.getSellerWithdrawals,
);

// ==========================================
// ផ្នែកអ្នកគ្រប់គ្រង (Admin)
// ==========================================
// Admin ទាញយកប្រវត្តិដកប្រាក់អ្នកលក់ទាំងអស់
router.get(
  "/admin/withdrawals",
  verifyToken,
  isAdmin,
  payoutController.getAllWithdrawals,
);

// ផ្លូវសម្រាប់ Approve និង Reject (មានស្រាប់)
router.post(
  "/admin/withdrawals/:withdrawalId/approve",
  verifyToken,
  isAdmin,
  payoutController.approveWithdrawal,
);
router.post(
  "/admin/withdrawals/:withdrawalId/reject",
  verifyToken,
  isAdmin,
  payoutController.rejectWithdrawal,
);

module.exports = router;
