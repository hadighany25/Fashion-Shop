const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// អតិថិជនចុះឈ្មោះ
router.post("/register", authController.registerBuyer);

// អ្នកប្រើប្រាស់ទាំងអស់ Login ចូល
router.post("/login", authController.login);

module.exports = router;
