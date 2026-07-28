const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ភ្ជាប់ទៅអ្នកទិញ (បើគាត់ Login)
      required: false, // ដាក់ false ក្រែងលោតមានអ្នកទិញអត់ Login (Guest)
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },

    // បញ្ជីទំនិញដែលគាត់បានទិញក្នុងវិក្កយបត្រនេះ
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        store: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Store", // ងាយស្រួលពេល Seller ចង់មើលថាមានគេទិញអីវ៉ាន់ពីហាងគាត់អត់
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // តម្លៃពេលកំពុងទិញ (ការពារក្រែងថ្ងៃក្រោយទំនិញឡើងថ្លៃ)
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer"], // cod = Cash on Delivery
      default: "cod",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
