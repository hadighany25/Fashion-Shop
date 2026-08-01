const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "seller", "buyer"],
      default: "buyer",
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    // ⬇️ ផ្នែកបន្ថែមថ្មីសម្រាប់ Profile U-Mall ⬇️
    fullName: {
      type: String,
      trim: true,
      default: "", // ទុកចំហសិនបាន ពេលទិញអីចាំបំពេញ
    },
    profileImage: {
      type: String,
      default: "https://via.placeholder.com/150", // រូបភាពតំណាង
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
