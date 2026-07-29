const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");

// ១. ទាញយកអ្នកប្រើប្រាស់ទាំងអស់ (សម្រាប់បង្ហាញក្នុង Table លើ Dashboard)
exports.getAllUsers = async (req, res) => {
  try {
    // ទាញយក Users ទាំងអស់ តែមិនយក password ទេ ដើម្បីសុវត្ថិភាព
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. បង្កើតគណនីថ្មីរួមបញ្ចូលគ្នា (Admin, Seller, ឬ Buyer)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, storeName, storeCategory } = req.body;

    // ឆែកមើលក្រែងឈ្មោះគណនីនេះមានរួចហើយ
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "ឈ្មោះគណនីនេះមានរួចហើយ!" });
    }

    // បើជ្រើសរើស Role ជា Seller ត្រូវប្រាកដថាគាត់បានបញ្ជូនឈ្មោះហាងមកដែរ
    if (role === "seller" && (!storeName || !storeCategory)) {
      return res.status(400).json({
        success: false,
        message: "សូមបំពេញឈ្មោះហាង និងប្រភេទហាងសម្រាប់អ្នកលក់!",
      });
    }

    // វាយលេខសម្ងាត់ជាកូដ (Hash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // បង្កើតគណនី User សិន (ទោះជា role អ្វីក៏ដោយ)
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "buyer",
    });

    const savedUser = await newUser.save();

    // បើសិនជាគាត់ជា Seller ត្រូវយក ID របស់គាត់ទៅបង្កើតហាង (Store) បន្តទៀត
    if (role === "seller") {
      const newStore = new Store({
        owner: savedUser._id,
        storeName,
        storeCategory,
        status: "active",
      });
      await newStore.save();
    }

    res.status(201).json({
      success: true,
      message: "បង្កើតគណនីបានជោគជ័យ!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. លុបគណនី (Delete User)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញគណនីនេះទេ!" });
    }

    // ការពារមិនឱ្យលុបគណនី Super Admin បានជាដាច់ខាត
    if (user.role === "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "មិនអាចលុបគណនី Super Admin បានទេ!" });
    }

    // លុប User នោះចោល
    await User.findByIdAndDelete(id);

    // បើសិនជាអ្នកដែលត្រូវលុបជា Seller យើងត្រូវលុបហាង (Store) របស់គាត់ចោលដែរ
    if (user.role === "seller") {
      await Store.findOneAndDelete({ owner: id });
    }

    res.status(200).json({ success: true, message: "លុបគណនីបានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៤. ទាញយកទិន្នន័យសរុបសម្រាប់បង្ហាញលើ Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalStores = await Store.countDocuments();

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalSellers, totalStores },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
