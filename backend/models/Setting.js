const mongoose = require("mongoose");

const bannerItemSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // 👈 ရើសហាងផ្ទាល់ពីក្នុង DB
  endDate: { type: Date }, // 👈 កាលបរិច្ឆេទឈប់បង្ហាញ
});

// ស្វែងរកកូដ bannerSectionSchema ហើយកែត្រង់បន្ទាត់នេះ៖
const bannerSectionSchema = new mongoose.Schema({
  intervalSeconds: { type: Number, default: 3 }, // 👈 ប្ដូរពី intervalMinutes មក intervalSeconds
  slideDirection: { type: String, default: "left" },
  items: [bannerItemSchema],
});

const settingSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: "" },
    section1: bannerSectionSchema, // ផ្ទាំងទី ១ (ធំខាងឆ្វេង)
    section2: bannerSectionSchema, // ផ្ទាំងទី ២ (ស្ដាំលើ)
    section3: bannerSectionSchema, // ផ្ទាំងទី ៣ (ស្ដាំក្រោម)
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
