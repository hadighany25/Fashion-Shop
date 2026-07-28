const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },

    // 🔗 [ថ្មី] ភ្ជាប់ Order នេះទៅកាន់គណនីអ្នកទិញពិតប្រាកដ
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // រក្សាទុក Fields ចាស់ៗដើម្បីកុំឱ្យ Error Frontend របស់បង
    cart: { type: Array, default: [] },
    itemsString: { type: String },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String },

    // 🔧 [កែសម្រួល] កំណត់ Status ឱ្យមានស្តង់ដារច្បាស់លាស់
    status: {
      type: String,
      enum: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },

    // 💳 [ថ្មី] ត្រៀមសម្រាប់ U-Pay Payment ខាងមុខ
    paymentMethod: { type: String, default: "COD" }, // ឧ. 'COD' (Cash on Delivery) ឬ 'UPAY'
    transactionId: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
