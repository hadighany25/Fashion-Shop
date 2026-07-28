const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ភ្ជាប់ទៅកាន់ User (អ្នកដែលជាម្ចាស់ហាង)
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeCategory: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active", // admin អាចបិទហាងនេះបានដោយដូរទៅ suspended
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Store", storeSchema);
