const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const jwt = require("jsonwebtoken");

// Middleware ឆែកសិទ្ធិ Admin
const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "YOUR_SECRET_KEY",
    );

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

router.get("/dashboard", verifyAdmin, adminController.getDashboardData);
router.post("/users", verifyAdmin, adminController.createSystemAccount);
router.delete("/users/:id", verifyAdmin, adminController.deleteUser);

module.exports = router;
