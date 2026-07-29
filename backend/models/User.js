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
    // បន្ថែមថ្មី សម្រាប់ Admin ងាយស្រួលគ្រប់គ្រង និងទាក់ទង
    phone: {
      type: String,
      unique: true,
      sparse: true, // អនុញ្ញាតឱ្យទទេបាន (null) តែបើមានគឺហាមជាន់គ្នា
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // បង្កើត createdAt និង updatedAt ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("User", userSchema);
