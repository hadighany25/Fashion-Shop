const mongoose = require("mongoose");

// បង្កើតទម្រង់ទំនិញនីមួយៗដែលស្ថិតក្នុង Order
// (យើងត្រូវរក្សាទុកតម្លៃដើមនៅពេលទិញ ជៀសវាងថ្ងៃក្រោយ Seller ដំឡើងថ្លៃ វាប៉ះពាល់ដល់វិក្កយបត្រចាស់)
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
      ref: "User",
      // អត់ដាក់ required ទេ ក្រែងលោថ្ងៃក្រោយបងចង់អោយ Guest (អ្នកអត់មានគណនី) ក៏អាចទិញបានដែរ
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true, // Order នេះបាញ់ទៅហាងមួយណា?
    },
    items: [orderItemSchema], // ផ្ទុកទំនិញដែលបានទិញ (អាចមានលើសពី ១មុខ ក្នុងហាងតែមួយ)
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
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery (COD)", // ជម្រើសបង់លុយតាមក្រោយ
    },
    status: {
      type: String,
      enum: ["new", "packing", "shipping", "completed", "cancelled"],
      default: "new", // ពេលទិញភ្លាម វានឹងលោតចូលជួរឈរ "New" ក្នុង Kanban Board របស់ហាងដោយស្វ័យប្រវត្តិ
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
