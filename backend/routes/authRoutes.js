const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ផ្ញើ Request ទៅកាន់ /api/register
router.post("/register", authController.register);

// ផ្ញើ Request ទៅកាន់ /api/login
router.post("/login", authController.login);

module.exports = router;
