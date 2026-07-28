const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");

// ១. បង្កើតគណនី Admin ថ្មី (សម្រាប់តែ Super Admin ប៉ុណ្ណោះដែលអាចហៅ Function នេះបាន)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "ឈ្មោះគណនីនេះមានរួចហើយ!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      username,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();
    res
      .status(201)
      .json({ success: true, message: "បង្កើតគណនី Admin បានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. បង្កើតគណនី Seller ថ្មី ព្រមទាំងបង្កើត Store ឱ្យគាត់ដោយស្វ័យប្រវត្តិ (Admin / Super Admin)
exports.createSeller = async (req, res) => {
  try {
    const { username, password, storeName, storeCategory } = req.body;

    // ឆែកមើលឈ្មោះគណនី
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "ឈ្មោះគណនីនេះមានរួចហើយ!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ជំហានទី១៖ បង្កើតគណនី User ជាសិន (Role: seller)
    const newSeller = new User({
      username,
      password: hashedPassword,
      role: "seller",
    });
    const savedSeller = await newSeller.save();

    // ជំហានទី២៖ យក ID របស់ Seller នោះមកបង្កើតហាង (Store)
    const newStore = new Store({
      owner: savedSeller._id,
      storeName,
      storeCategory,
      status: "active",
    });
    await newStore.save();

    res.status(201).json({
      success: true,
      message: "បង្កើតគណនីអ្នកលក់ និងហាងបានជោគជ័យ!",
      store: newStore,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. ទាញយកទិន្នន័យសរុបសម្រាប់បង្ហាញលើ Admin Dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalStores = await Store.countDocuments();

    res.json({
      success: true,
      stats: { totalUsers, totalSellers, totalStores },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
