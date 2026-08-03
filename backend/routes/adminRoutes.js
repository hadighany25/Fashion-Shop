const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// ទី១៖ ត្រូវថែម isAdmin ចូលក្នុង Import នេះទើបវាស្គាល់
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ទី២៖ router.use នេះមានន័យថាវាឆែក Token សម្រាប់រាល់ Routes ខាងក្រោមទាំងអស់
router.use(verifyToken);

router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUserAndStore);
router.delete("/users/:id", adminController.deleteUser);
router.get("/stores", adminController.getStores);

// ទី៣៖ កន្លែងនេះមិនបាច់ដាក់ verifyToken ម្ដងទៀតទេ ព្រោះយើងបានប្រើ router.use រួចហើយ ដាក់តែ isAdmin ទៅបានហើយ
router.get("/withdrawals", isAdmin, adminController.getAllWithdrawals);

module.exports = router;
