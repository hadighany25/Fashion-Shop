const mongoose = require("mongoose");

// ១. ម៉ូដែលរងសម្រាប់ទំនិញនីមួយៗក្នុងកន្ត្រក (Order Item Schema)
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  // ចំណុចសំខាន់៖ ត្រូវដឹងថាទំនិញនេះជារបស់ហាងណា ដើម្បីបែងចែកលុយ
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
});

// ២. ម៉ូដែលគោលសម្រាប់វិក័យប័ត្រទាំងមូល (Master Order Schema)
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true, // លេខកូដវិក័យប័ត្រ (ឧ. ORD-123456)
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // អ្នកទិញ
    },
    customerInfo: {
      name: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    items: [orderItemSchema], // បញ្ចូលទំនិញទាំងអស់មកទីនេះ
    totalAmount: {
      type: Number,
      required: true, // សរុបទឹកប្រាក់ត្រូវបង់
    },
    paymentMethod: {
      type: String,
      enum: ["upay_qr", "upay_card"],
      default: "upay_qr",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING", // ដំបូងគឺ PENDING រហូតដល់ Webhook ប្រាប់ថា PAID
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    upayTransactionId: {
      type: String, // ទុកកត់ត្រាលេខកូដប្រតិបត្តិការពី U-Pay (ល្អសម្រាប់ពេលចង់ Refund)
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
