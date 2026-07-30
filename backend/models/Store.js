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

    // ==========================================
    // ចំណុចដែលទើបតែបន្ថែមថ្មីសម្រាប់ Seller Center
    // ==========================================
    categories: {
      type: [String], // ទម្រង់ Array សម្រាប់ទុកឈ្មោះ Category ច្រើន (ឧ. ["អាវ", "ខោ", "ស្បែកជើង"])
      default: [],
    },
    paymentInfo: {
      bankName: { type: String, default: "" }, // ឈ្មោះធនាគារ (ឧ. ABA, ACLEDA)
      accountName: { type: String, default: "" }, // ឈ្មោះម្ចាស់គណនី
      accountNumber: { type: String, default: "" }, // លេខគណនី
    },
    // ==========================================

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
