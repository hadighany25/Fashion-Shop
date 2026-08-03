const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    amount: { type: Number, required: true }, // ចំនួនទឹកប្រាក់ដែលសុំដក
    uPayInfo: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      // pending = អ្នកលក់ទើបស្នើសុំ (Admin មិនទាន់ចុច)
      // processing = Admin ចុចហើយ (លុយត្រូវបង្កក Freeze នៅលើ U-Pay)
      // completed = ប្រព័ន្ធកាត់ស្វ័យប្រវត្តិជោគជ័យ
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // កត់ត្រាថា Admin ណាជាអ្នកចុច
    frozenAt: { type: Date }, // ម៉ោងដែល Admin ចុចបង្កក
    autoSettleAt: { type: Date }, // ម៉ោងដែលប្រព័ន្ធត្រូវបាញ់លុយចូលកុងអ្នកលក់ដោយស្វ័យប្រវត្តិ (ឧ. ២ ម៉ោងក្រោយ)
  },
  { timestamps: true },
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
