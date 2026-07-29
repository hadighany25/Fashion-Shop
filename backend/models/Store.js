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
      trim: true, // Admin អាចវាយបញ្ចូលប្រភេទអីក៏បានតាមចិត្ត
    },
    // បន្ថែមថ្មី សម្រាប់ Profile ហាងពេញលេញ
    description: {
      type: String,
      default: "",
    },
    logoUrl: {
      type: String,
      default: "", // ទុកចំហរឱ្យ Admin ឬ Seller ដាក់ Link រូបតាមក្រោយ
    },
    address: {
      type: String,
      default: "", // ទីតាំងហាង
    },
    // បន្ថែមថ្មី សម្រាប់ប្រព័ន្ធលុយកាក់ (Admin គ្រប់គ្រង)
    commissionRate: {
      type: Number,
      default: 10, // ឧទាហរណ៍៖ ប្រព័ន្ធកាត់កុង ១០% ពីរាល់ការលក់
    },
    walletBalance: {
      type: Number,
      default: 0, // លុយដែលហាងលក់បាន ត្រៀមដក (Payout)
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
