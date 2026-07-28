const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  verifyToken,
  isSuperAdmin,
  isAdmin,
} = require("../middleware/authMiddleware");

// ១. បង្កើត Admin ថ្មី (ត្រូវមាន Token ត្រឹមត្រូវ នឹងត្រូវតែមានតួនាទីជា Super Admin)
router.post("/admin", verifyToken, isSuperAdmin, adminController.createAdmin);

// ២. បង្កើតអ្នកលក់ និងហាង (ត្រូវមាន Token ត្រឹមត្រូវ នឹងត្រូវតែមានតួនាទីចាប់ពី Admin ឡើងទៅ)
router.post("/seller", verifyToken, isAdmin, adminController.createSeller);

// ៣. ទាញយកទិន្នន័យសរុបបង្ហាញលើ Dashboard (ត្រូវតែជា Admin)
router.get("/stats", verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router;
