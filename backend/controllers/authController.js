const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ១. សម្រាប់អតិថិជនទូទៅចុះឈ្មោះ (Buyer Register)
exports.registerBuyer = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ឆែកមើលក្រែងមានឈ្មោះនេះរួចហើយក្នុងប្រព័ន្ធ
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "ឈ្មោះគណនីនេះមានអ្នកប្រើប្រាស់ហើយ!" });
    }

    // បំប្លែង Password ទៅជាកូដសម្ងាត់មុននឹង Save ចូល Database
    const hashedPassword = await bcrypt.hash(password, 10);

    // បង្កើតគណនីថ្មី (Role default គឺ 'buyer' ផ្អែកតាម Model)
    const newUser = new User({
      username,
      password: hashedPassword,
      role: "buyer",
    });

    await newUser.save();

    res
      .status(201)
      .json({ success: true, message: "ចុះឈ្មោះទទួលបានជោគជ័យ! សូម Login." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. សម្រាប់អ្នកប្រើប្រាស់ទាំងអស់ Login (Buyer, Seller, Admin, Super Admin)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ស្វែងរក User ក្នុង Database
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!",
        });
    }

    // ផ្ទៀងផ្ទាត់លេខសម្ងាត់ដែលវាយបញ្ចូល ជាមួយនឹងកូដសម្ងាត់ក្នុង Database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({
          success: false,
          message: "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!",
        });
    }

    // បង្កើត Token (សំបុត្រឆ្លងដែន) ដើម្បីឱ្យ User យកទៅប្រើប្រាស់
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || "FASHION_SHOP_SECRET_KEY",
      { expiresIn: "1d" }, // សុពលភាព 1 ថ្ងៃ
    );

    // [ចំណុចពិសេស]: បើគាត់ជាអ្នកលក់ (Seller) យើងត្រូវរកមើលហាងរបស់គាត់ ដើម្បីបោះទិន្នន័យហាងទៅឲ្យ Frontend ប្រើប្រាស់ផងដែរ
    let storeData = null;
    if (user.role === "seller") {
      const store = await Store.findOne({ owner: user._id });
      if (store) {
        storeData = {
          id: store._id,
          name: store.storeName,
          status: store.status,
        };
      }
    }

    // បោះទិន្នន័យត្រឡប់ទៅ Frontend វិញ
    res.json({
      success: true,
      message: "ចូលគណនីបានជោគជ័យ!",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      store: storeData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
