const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
// ត្រូវមាន Middleware ឆែក Token ផង (ឧ. verifyAdmin)

router.get("/users", adminController.getAllUsers); // ទាញយក Users បង្ហាញលើ Table
router.post("/users", adminController.createUser); // បង្កើត Admin/Seller/Buyer ពី Form
router.delete("/users/:id", adminController.deleteUser); // លុប User
router.get("/stats", adminController.getDashboardStats); // ទាញយកទិន្នន័យសរុប

module.exports = router;
