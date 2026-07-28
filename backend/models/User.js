const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ (Username)"],
      unique: true,
      trim: true, // កាត់ចោល Space ខាងមុខនិងខាងក្រោយ
      minlength: [3, "ឈ្មោះអ្នកប្រើប្រាស់ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរ"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // អនុញ្ញាតឱ្យមាន User ដែលអត់ទាន់ដាក់ Email កុំឱ្យ Error ជាន់គ្នា
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "សូមបញ្ចូលពាក្យសម្ងាត់ (Password)"],
      minlength: [6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ"],
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"], // កំណត់សិទ្ធិឱ្យមានតែ ៣ នេះប៉ុណ្ណោះ
      default: "buyer", // ពេលចុះឈ្មោះភ្លាម វានឹងកំណត់ជាអ្នកទិញដោយស្វ័យប្រវត្តិ
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    // ត្រៀមទុកសម្រាប់ភ្ជាប់ U-Pay / Telegram ថ្ងៃក្រោយ តាមដែលបងចង់បាន
    telegramChatId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // វានឹងបង្កើត field `createdAt` និង `updatedAt` ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("User", userSchema);
