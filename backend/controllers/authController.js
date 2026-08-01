const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ១. សម្រាប់អតិថិជនទូទៅចុះឈ្មោះ (Buyer Register - គាំទ្រ Multi-Step)
exports.registerBuyer = async (req, res) => {
  try {
    // ចាប់យកទិន្នន័យទាំងអស់ដែល Frontend (Multi-step) បានផ្ញើមក
    const {
      username,
      password,
      fullName,
      phone,
      email,
      address,
      profileImage,
    } = req.body;

    // ១. ឆែកមើលឈ្មោះគណនី (Username) ក្រែងជាន់គ្នា
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "ឈ្មោះគណនីនេះមានអ្នកប្រើប្រាស់ហើយ!" });
    }

    // ២. ឆែកលេខទូរស័ព្ទ (Phone) ក្រែងជាន់គ្នា (បើមានវាយបញ្ចូល)
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "លេខទូរស័ព្ទនេះមានអ្នកប្រើប្រាស់រួចហើយ!",
        });
      }
    }

    // ៣. ឆែកអ៊ីមែល (Email) ក្រែងជាន់គ្នា (បើមានវាយបញ្ចូល)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ!",
        });
      }
    }

    // ៤. បំប្លែង Password ទៅជាកូដសម្ងាត់មុននឹង Save ចូល Database
    const hashedPassword = await bcrypt.hash(password, 10);

    // ៥. រៀបចំកញ្ចប់ទិន្នន័យសម្រាប់ Save (លក្ខខណ្ឌការពារ Error Empty Unique Field)
    const userData = {
      username,
      password: hashedPassword,
      role: "buyer", // ដាក់ Default ជា Buyer ទោះ Frontend បាញ់អ្វីមកក៏ដោយ ដើម្បីសុវត្ថិភាព
      fullName: fullName || "",
      address: address || "",
      profileImage:
        profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    };

    // បញ្ចូលលេខ និង អ៊ីមែល តែពេលវាមានតម្លៃ (ការពារកុំឱ្យ Save អក្សរទទេ "" ដែលបណ្តាលឱ្យ Error)
    if (phone) userData.phone = phone;
    if (email) userData.email = email;

    // ៦. បង្កើតគណនីថ្មី
    const newUser = new User(userData);
    await newUser.save();

    res
      .status(201)
      .json({ success: true, message: "ចុះឈ្មោះទទួលបានជោគជ័យ! សូម Login." });
  } catch (error) {
    // ករណី Error ផ្សេងៗពី Database
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. សម្រាប់អ្នកប្រើប្រាស់ទាំងអស់ Login (គាំទ្រ Username / Phone / Email)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const loginKey = username.trim(); // ដកឃ្លាចេញសងខាងការពារ Error

    // 🌟 ប្រើ $or ដើម្បីស្វែងរក User តាមរយៈ ឈ្មោះ ឬ លេខទូរស័ព្ទ ឬ អ៊ីមែល
    const user = await User.findOne({
      $or: [{ username: loginKey }, { phone: loginKey }, { email: loginKey }],
    });

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "គណនី លេខទូរស័ព្ទ ឬអ៊ីមែល មិនត្រឹមត្រូវទេ!",
        });
    }

    // ផ្ទៀងផ្ទាត់លេខសម្ងាត់
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "លេខសម្ងាត់មិនត្រឹមត្រូវទេ!" });
    }

    // បង្កើត Token (សំបុត្រឆ្លងដែន)
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || "FASHION_SHOP_SECRET_KEY",
      { expiresIn: "1d" }, // សុពលភាព 1 ថ្ងៃ
    );

    // ស្វែងរកហាងបើគាត់ជា Seller
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

    res.json({
      success: true,
      message: "ចូលគណនីបានជោគជ័យ!",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        profileImage: user.profileImage,
      },
      store: storeData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
