const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ឬ Model ឈ្មោះអ្វីដែលបងប្រើសម្រាប់ Seller
      required: true,
    },
    amount: { type: Number, required: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"],
      default: "PENDING",
    },
    upayTransactionId: { type: String }, // ទុកលេខកូដពី U-Pay
    pdfUrl: { type: String }, // ទុក Link វិក្កយបត្រ PDF
    note: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
