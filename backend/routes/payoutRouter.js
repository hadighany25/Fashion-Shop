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
router.post(
  "/seller/withdraw",
  verifyToken,
  isSeller,
  payoutController.requestWithdrawal,
);

// ==========================================
// ផ្នែកអ្នកគ្រប់គ្រង (Admin)
// ==========================================

// ផ្លូវសម្រាប់ Approve (មានស្រាប់)
router.post(
  "/admin/withdrawals/:withdrawalId/approve",
  verifyToken,
  isAdmin,
  payoutController.approveWithdrawal,
);

// 🚀 ផ្លូវថ្មីសម្រាប់ Reject (ថែមចូល)
router.post(
  "/admin/withdrawals/:withdrawalId/reject",
  verifyToken,
  isAdmin,
  payoutController.rejectWithdrawal,
);

module.exports = router;
