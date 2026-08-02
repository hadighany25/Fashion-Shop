// ទីតាំង៖ models/Order.js
const mongoose = require("mongoose");
const User = require("./User"); // 👈 កែត្រង់នេះ៖ លុបអក្សរ s ចេញ (ឱ្យដូចឈ្មោះ File ពិតប្រាកដ)

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // ១. ផ្នែកទូទាត់ប្រាក់
    // ==========================================
    orderId: { type: String, required: true, unique: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, default: "PENDING" },
    upayTransactionId: { type: String },
    paidAt: { type: Date },

    // ==========================================
    // ២. ផ្នែកទំនាក់ទំនង (អ្នកទិញ អ្នកលក់ និងទីតាំង)
    // ==========================================
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    shippingAddress: {
      type: String,
      default: "មិនទាន់បញ្ជាក់",
    },
    phone: {
      type: String,
      default: "មិនទាន់បញ្ជាក់",
    },

    // ==========================================
    // ៣. បញ្ជីទំនិញ
    // ==========================================
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String },
        variant: { type: String },
      },
    ],

    // ==========================================
    // ៤. ផ្នែកគ្រប់គ្រងការដឹកជញ្ជូន
    // ==========================================
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    timeline: [
      {
        status: { type: String },
        date: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 🌟 Mongoose Pre-save Hook (ស៊េរីការពារការគាំង) 🌟
orderSchema.pre("save", async function (next) {
  try {
    // ឆែកមើលថាមាន buyer ហើយវាជា ObjectId ត្រឹមត្រូវ (កុំឱ្យ CastError)
    if (
      this.buyer &&
      mongoose.Types.ObjectId.isValid(this.buyer) &&
      (this.phone === "មិនទាន់បញ្ជាក់" ||
        this.shippingAddress === "មិនទាន់បញ្ជាក់")
    ) {
      // ទាញយក User Model ដោយផ្ទាល់ ជៀសវាង Error Require Module
      const User = mongoose.models.User;

      if (User) {
        const user = await User.findById(this.buyer);
        if (user) {
          if (this.phone === "មិនទាន់បញ្ជាក់" && user.phone)
            this.phone = user.phone;
          if (this.shippingAddress === "មិនទាន់បញ្ជាក់" && user.address)
            this.shippingAddress = user.address;
        }
      }
    }
    next();
  } catch (error) {
    console.error("⚠️ Hook Error (Ignored):", error);
    next(); // 👈 សំខាន់! ទោះមាន Error ក្នុង Hook ក៏ឱ្យវាបន្ត Save Order ដែរ ដើម្បីកុំឱ្យគាំងទូទាត់លុយ
  }
});

module.exports = mongoose.model("Order", orderSchema);
