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
      default: "", // Link រូបភាព
    },
    description: {
      type: String,
      default: "",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true, // ផលិតផលនីមួយៗដាច់ខាតត្រូវតែជារបស់ហាងណាមួយ
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // ភ្ជាប់ទៅកាន់ Category (បងអាចប្ដូរទៅជា String ធម្មតាក៏បាន បើអត់ចង់ប្រើ Category Model)
    },
  },
  {
    timestamps: true, // វានឹងបង្កើតថ្ងៃខែបន្ថែម (createdAt, updatedAt) ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("Product", productSchema);
