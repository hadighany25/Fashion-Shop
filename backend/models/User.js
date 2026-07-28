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
  },
  {
    timestamps: true, // បង្កើត createdAt និង updatedAt ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("User", userSchema);
