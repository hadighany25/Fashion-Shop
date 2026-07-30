const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// Route សម្រាប់ទាញយកផលិតផលទៅបង្ហាញនៅទំព័រមុខ
router.get("/products", publicController.getAllPublicProducts);

module.exports = router;
