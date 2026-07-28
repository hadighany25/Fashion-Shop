const User = require("../models/User");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

// 1. Get Dashboard Stats & Users List
exports.getDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalProducts = await Product.countDocuments();
    const users = await User.find({}, "-password").sort({ _id: -1 });

    res.json({
      success: true,
      stats: { totalUsers, totalSellers, totalProducts },
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Admin or Seller Account
exports.createSystemAccount = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
