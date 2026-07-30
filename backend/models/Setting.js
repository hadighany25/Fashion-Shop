const mongoose = require("mongoose");

const bannerItemSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // 👈 ရើសហាងផ្ទាល់ពីក្នុង DB
  endDate: { type: Date }, // 👈 កាលបរិច្ឆេទឈប់បង្ហាញ
});

const bannerSectionSchema = new mongoose.Schema({
  intervalMinutes: { type: Number, default: 1 }, // 👈 កំណត់ចំនួននាទីដូររូប
  slideDirection: { type: String, default: "left" }, // left ឬ right
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
