const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    totalAmount: { type: Number, required: true },
    items: { type: Array, default: [] },
    paymentStatus: { type: String, default: "PENDING" }, // លំនាំដើមគឺ PENDING (រង់ចាំលុយ)
    upayTransactionId: { type: String }, // ទុកកត់ត្រាលេខកូដប្រតិបត្តិការពី U-Pay
    paidAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
