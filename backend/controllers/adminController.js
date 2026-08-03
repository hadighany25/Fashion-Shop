const User = require("../models/User");
const Store = require("../models/Store");
const Withdrawal = require("../models/Withdrawal");
const bcrypt = require("bcryptjs");

// ១. ទាញយកអ្នកប្រើប្រាស់ទាំងអស់
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. បង្កើតគណនី និងហាងព្រមគ្នា
exports.createUserAndStore = async (req, res) => {
  try {
    const { username, password, role, phone, email, storeName, storeCategory } =
      req.body;

    // ឆែកមើលក្រែងលោមានអ្នកប្រើឈ្មោះនេះរួចហើយ
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Username នេះមានគេប្រើរួចហើយ!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // បង្កើតគណនីថ្មី
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "buyer",
      phone: phone || undefined,
      email: email || undefined,
    });
    await newUser.save();

    // បើគណនីនោះជា Seller យើងបង្កើតហាង (Store) ឱ្យគាត់ដោយស្វ័យប្រវត្តិ
    if (newUser.role === "seller") {
      if (!storeName || !storeCategory) {
        // បើអត់មានឈ្មោះហាង យើងលុបគណនីវិញ ដើម្បីកុំឱ្យខូចទិន្នន័យ
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({
          success: false,
          message: "ត្រូវតែមានឈ្មោះហាង និងប្រភេទហាងសម្រាប់ Seller!",
        });
      }

      const newStore = new Store({
        owner: newUser._id,
        storeName,
        storeCategory,
      });
      await newStore.save();
    }

    res
      .status(201)
      .json({ success: true, message: "បង្កើតគណនីបានជោគជ័យ!", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. លុបគណនី
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញគណនីនេះទេ!" });

    // បើជា seller ត្រូវលុបហាងចោលដែរ
    if (user.role === "seller") {
      await Store.findOneAndDelete({ owner: user._id });
    }
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "លុបបានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៤. ទាញយកហាងទាំងអស់ (សម្រាប់ Store Management)
exports.getStores = async (req, res) => {
  try {
    // populate('owner') ដើម្បីទាញយក username, phone, email ពី User មកបង្ហាញជាមួយ Store
    const stores = await Store.find()
      .populate("owner", "username phone email status")
      .sort({ createdAt: -1 });
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// មុខងារសម្រាប់ទាញយកប្រវត្តិដកប្រាក់ទាំងអស់មកបង្ហាញ Admin
exports.getAllWithdrawals = async (req, res) => {
  try {
    // ទាញយកសំណើទាំងអស់ រៀបតាមថ្ងៃថ្មីៗបំផុត (createdAt: -1)
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      withdrawals: withdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ!" });
  }
};
