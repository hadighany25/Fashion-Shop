const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");

// ត្រូវប្រាកដថាមានតែ Admin ទើបអាចហៅបាន
router.use(verifyToken);

router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUserAndStore);
router.delete("/users/:id", adminController.deleteUser);
router.get("/stores", adminController.getStores); // Route ថ្មីសម្រាប់ទាញ Stores

module.exports = router;
