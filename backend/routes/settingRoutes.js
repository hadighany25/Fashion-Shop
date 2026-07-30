const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware"); // យក Middleware ការពារ Admin

// អ្នកណាក៏អាចមើលឃើញ Logo និង Banner បានដែរ (Public)
router.get("/", settingController.getSettings);

// មានតែ Admin ទេ ទើបអាចកែប្រែបាន
router.put("/", verifyToken, isAdmin, settingController.updateSettings);

module.exports = router;
