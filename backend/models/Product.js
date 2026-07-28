const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true }, // រក្សាទុកតាមសំណូមពរ ដើម្បីកុំឱ្យ Error Frontend
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    img: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 },

    // 🔗 [ថ្មី] ភ្ជាប់ទំនិញនេះទៅកាន់ម្ចាស់ហាង (អ្នកលក់)
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ទាញទិន្នន័យពី User Model (ដែលមាន role ជា seller)
      required: true,
    },
  },
  {
    timestamps: true, // បង្កើត createdAt និង updatedAt ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("Product", productSchema);
