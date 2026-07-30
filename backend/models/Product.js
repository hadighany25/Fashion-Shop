const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "", // Link រូបភាពទំនិញ
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true, // លែងប្រើ ObjectId ហើយ ប្រើជា String ធម្មតាវិញ
      trim: true,
    },
    // ចំណុចសំខាន់៖ ភ្ជាប់ទំនិញនេះទៅកាន់ហាង (Store)
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
