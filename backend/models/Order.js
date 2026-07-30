const mongoose = require("mongoose");

// ទម្រង់ទំនិញដែលបានទិញ (រក្សាទុកតម្លៃដើម កុំឱ្យខូចវិក្កយបត្រពេល Seller ដំឡើងថ្លៃតាមក្រោយ)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  imageUrl: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // អ្នកទិញ (Buyer)
    },
    // ចំណុចសំខាន់៖ ភ្ជាប់ Order នេះទៅកាន់ហាង (Store) មួយណា?
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [orderItemSchema], // បញ្ជីទំនិញដែលបានទិញ
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    itemsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    status: {
      type: String,
      enum: ["new", "packing", "shipping", "completed", "cancelled"],
      default: "new",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
