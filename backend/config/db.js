const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // បន្ថែមបន្ទាត់នេះ ដើម្បីឆែកមើលតម្លៃពិតប្រាកដនៅលើ Server
    console.log(
      "Check MONGO_URI on Server:",
      process.env.MONGO_URI ? "✅ មានតម្លៃ" : "❌ ទទេ (Undefined)",
    );
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
