// ទីតាំង៖ models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // ១. ផ្នែកទូទាត់ប្រាក់ (រក្សាកូដចាស់បង ១០០% មិនឱ្យប៉ះពាល់)
    // ==========================================
    orderId: { type: String, required: true, unique: true }, // លេខកូដ Order សម្រាប់ផ្ទៀងផ្ទាត់ជាមួយ U-Pay
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: "PENDING" }, // លំនាំដើម PENDING (រង់ចាំលុយ)
    upayTransactionId: { type: String }, // កត់ត្រាលេខកូដប្រតិបត្តិការពី U-Pay
    paidAt: { type: Date },

    // ==========================================
    // ២. ផ្នែកទំនាក់ទំនង (អ្នកទិញ អ្នកលក់ និងទីតាំង)
    // ==========================================
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },

    // ==========================================
    // ៣. បញ្ជីទំនិញ (ជំនួស Array ធម្មតា ទៅជា Array ដែលមានទម្រង់ច្បាស់លាស់ ដើម្បីស្រួលបង្ហាញរូប និងតម្លៃ)
    // ==========================================
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String },
        variant: { type: String }, // ឧទាហរណ៍៖ ទំហំ XL, ពណ៌ក្រហម
      },
    ],

    // ==========================================
    // ៤. ផ្នែកគ្រប់គ្រងការដឹកជញ្ជូន (Order Management)
    // ==========================================
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed", "cancelled"],
      default: "pending", // លំនាំដើមពេលទើបបញ្ជាទិញ
    },

    // ខ្សែបន្ទាត់ពេលវេលាដើម្បីបង្ហាញអតិថិជន
    timeline: [
      {
        status: { type: String },
        date: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],

    // សម្គាល់ថាគាត់បានវាយតម្លៃ (Review) ហើយឬនៅ
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
