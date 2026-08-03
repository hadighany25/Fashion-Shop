const express = require("express");
const router = express.Router();
const payoutController = require("../controllers/payoutController");

// ចំណាំ៖ បងត្រូវទាញយក Middleware ដែលបងកំពុងប្រើស្រាប់ សម្រាប់ការពារ Route ទាំងនេះ
// បើ File Middleware របស់បងឈ្មោះផ្សេង សូមកែឈ្មោះត្រង់នេះឱ្យត្រូវ
const {
  verifyToken,
  verifyAdminToken,
} = require("../middleware/authMiddleware");

// ==========================================
// ផ្នែកអ្នកលក់ (Seller)
// ==========================================
// អ្នកលក់ស្នើសុំដកប្រាក់ (ទាមទារ Token អ្នកលក់)
router.post(
  "/seller/withdraw",
  verifyToken,
  payoutController.requestWithdrawal,
);

// ==========================================
// ផ្នែកអ្នកគ្រប់គ្រង (Admin)
// ==========================================
// Admin អនុម័តការដកប្រាក់ (ទាមទារ Token Admin)
router.post(
  "/admin/withdrawals/:withdrawalId/approve",
  verifyAdminToken,
  payoutController.approveWithdrawal,
);

module.exports = router;
