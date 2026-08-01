const express = require("express");
const router = express.Router();

// 🟢 ជួសជុលទី១៖ ដូរទីតាំងទៅកាន់ឯកសារ authMiddleware.js និងប្រើឈ្មោះ verifyToken
const { verifyToken } = require("../middleware/authMiddleware");

// Import Functions ពី Controller មកវិញ
const {
  getUserProfile,
  updateBasicProfile,
  updateSecureProfile,
  changePassword,
} = require("../controllers/userController");

// ==========================================
// ផ្លូវ (Routes) សម្រាប់ Profile អ្នកប្រើប្រាស់
// ==========================================

// 🟢 ជួសជុលទី២៖ ប្រើពាក្យ verifyToken ជំនួស authMiddleware គ្រប់កន្លែង

// ទាញយកព័ត៌មាន User (GET: /api/user/profile)
router.get("/profile", verifyToken, getUserProfile);

// កែប្រែព័ត៌មានធម្មតា (PUT: /api/user/profile/basic)
router.put("/profile/basic", verifyToken, updateBasicProfile);

// កែប្រែព័ត៌មានទាមទារសុវត្ថិភាព (PUT: /api/user/profile/secure)
router.put("/profile/secure", verifyToken, updateSecureProfile);

// ផ្លាស់ប្តូរលេខសម្ងាត់ (PUT: /api/user/profile/password)
router.put("/profile/password", verifyToken, changePassword);

module.exports = router;
