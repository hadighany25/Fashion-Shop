const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Username already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // បង្កើត User ថ្មី (Role វានឹងយក "buyer" ដោយស្វ័យប្រវត្តិ ផ្អែកតាម Model ថ្មីរបស់យើង)
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Register success!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      // 🔧 ១. បន្ថែម `id` និង `role` ចូលទៅក្នុង Token ដើម្បីឱ្យ Middleware អាចអានបាន
      // (ខ្ញុំប្រើប្រាស់ JWT_SECRET និង SECRET_KEY ដើម្បីការពារ Error ក្រែងលោបងប្រើមួយណា)
      const secretKey =
        process.env.JWT_SECRET ||
        process.env.SECRET_KEY ||
        "fallback_secret_key";
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        secretKey,
        { expiresIn: "1d" }, // ប្តូរទៅ ១ ថ្ងៃវិញ ងាយស្រួលធ្វើតេស្ត មិនបាច់ Login ញឹកញាប់
      );

      // 🔧 ២. បន្ថែម `role` ទៅក្នុង Response ដើម្បីឱ្យ Frontend អាចបែងចែក Admin និង User បាន
      res.json({
        success: true,
        token,
        username: user.username,
        role: user.role,
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
