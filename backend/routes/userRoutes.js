const express = require("express");
const router = express.Router();

// Import Middleware ដើម្បីឆែក Token
// (បងត្រូវប្រាកដថា Path ត្រូវនឹងឯកសារ Middleware របស់បង)
const { authMiddleware } = require("../middleware/auth");

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

// ទាញយកព័ត៌មាន User (GET: /api/user/profile)
router.get("/profile", authMiddleware, getUserProfile);

// កែប្រែព័ត៌មានធម្មតា (PUT: /api/user/profile/basic)
router.put("/profile/basic", authMiddleware, updateBasicProfile);

// កែប្រែព័ត៌មានទាមទារសុវត្ថិភាព (PUT: /api/user/profile/secure)
router.put("/profile/secure", authMiddleware, updateSecureProfile);

// ផ្លាស់ប្តូរលេខសម្ងាត់ (PUT: /api/user/profile/password)
router.put("/profile/password", authMiddleware, changePassword);

module.exports = router;
