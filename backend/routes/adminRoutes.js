const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// ទី១៖ ត្រូវថែម isAdmin ចូលក្នុង Import នេះទើបវាស្គាល់
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ទី២៖ router.use នេះមានន័យថាវាឆែក Token សម្រាប់រាល់ Routes ខាងក្រោមទាំងអស់
router.use(verifyToken);

// ==========================================
// ជួរទី១៖ គ្រប់គ្រង Users
// ==========================================
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUserAndStore);
router.delete("/users/:id", adminController.deleteUser);

// ==========================================
// ជួរទី២៖ គ្រប់គ្រង Stores
// ==========================================
router.get("/stores", adminController.getStores);

// ==========================================
// ជួរទី៣៖ គ្រប់គ្រងហិរញ្ញវត្ថុ (Withdrawals)
// ទី៣៖ កន្លែងនេះមិនបាច់ដាក់ verifyToken ម្ដងទៀតទេ ព្រោះយើងបានប្រើ router.use រួចហើយ ដាក់តែ isAdmin ទៅបានហើយ
// ==========================================
router.get("/withdrawals", isAdmin, adminController.getAllWithdrawals);

// ==========================================
// 🚀 ជួរទី៤៖ API ថ្មីសម្រាប់ Dashboard Stats ទាញទិន្នន័យពិត (Real-time)
// ==========================================
router.get("/dashboard-stats", isAdmin, adminController.getDashboardStats);

module.exports = router;
