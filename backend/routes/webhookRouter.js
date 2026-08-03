const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// ទទួលសំណើ POST ពី U-Pay ត្រង់ចំណុច ( /api/webhook/upay )
router.post("/upay", webhookController.upayWebhook);

module.exports = router;
