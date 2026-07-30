const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    logoUrl: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    heroBanners: [
      {
        imageUrl: String,
        linkUrl: String,
        title: String,
      },
    ],
    subBanners: [
      {
        imageUrl: String,
        linkUrl: String,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
