const User = require("../models/User"); // ត្រូវប្រាកដថា Path នេះត្រូវនឹង File Model របស់បង
const bcrypt = require("bcryptjs");

// ១. ទាញយកព័ត៌មាន Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញគណនី" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "មានបញ្ហាបច្ចេកទេស" });
  }
};

// ២. អាប់ដេតទិន្នន័យទូទៅ (រូបថត, ឈ្មោះ, ទីតាំង)
const updateBasicProfile = async (req, res) => {
  try {
    const { fullName, profileImage, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { fullName, profileImage, address },
      { new: true }, // ដើម្បីឲ្យវា Return ទិន្នន័យថ្មីមកវិញ
    ).select("-password");

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update Basic Profile Error:", error);
    res.status(500).json({ success: false, message: "មិនអាចរក្សាទុកបានទេ" });
  }
};

// ៣. អាប់ដេតទិន្នន័យសំខាន់ (លេខទូរស័ព្ទ, អ៊ីមែល) - ត្រូវឆែក Password
const updateSecureProfile = async (req, res) => {
  try {
    const { field, value, password } = req.body; // field = 'phone' ឬ 'email'
    const user = await User.findById(req.user.id || req.user._id);

    // បើគណនីនោះធ្លាប់មានលេខ ឬ អ៊ីមែលរួចហើយ ទើបទាមទារ Password បញ្ជាក់
    if (user[field] && user[field].trim() !== "") {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "លេខសម្ងាត់មិនត្រឹមត្រូវទេ!" });
      }
    }

    user[field] = value;
    await user.save();

    // លុប password ចេញមុននឹងបញ្ជូនទៅ Frontend វិញ ដើម្បីសុវត្ថិភាព
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Secure Profile Error:", error);
    // ករណីជាន់លេខ ឬ អ៊ីមែលអ្នកផ្សេង (MongoDB Duplicate Key Error)
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ទិន្នន័យនេះមានអ្នកប្រើប្រាស់រួចហើយ!",
        });
    }
    res.status(500).json({ success: false, message: "មានបញ្ហាបច្ចេកទេស" });
  }
};

// ៤. ផ្លាស់ប្តូរលេខសម្ងាត់
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id || req.user._id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "ផ្លាស់ប្តូរលេខសម្ងាត់ជោគជ័យ!" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "មានបញ្ហាបច្ចេកទេស" });
  }
};

module.exports = {
  getUserProfile,
  updateBasicProfile,
  updateSecureProfile,
  changePassword,
};
