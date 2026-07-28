require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// 1. Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

// 2. Import Controller for Telegram Bot
const { pollTelegramUpdates } = require("./controllers/orderController");

const app = express(); // ⚠️ ត្រូវបង្កើត app ឱ្យបានមុនសិន ទើបយកមកប្រើប្រាស់ជាមួយ app.use()

// 3. Middleware
app.use(express.json());
app.use(cors());

// 4. Connect Database
connectDB();

// 5. បម្រើឯកសារ Static (Frontend នៅក្នុង Folder public)
app.use(express.static(path.join(__dirname, "public")));

// 6. Set up API Routes
app.use("/api/auth", authRoutes); // សម្រាប់ Login/Register
app.use("/api/products", productRoutes); // សម្រាប់ទំនិញ
app.use("/api/orders", orderRoutes); // សម្រាប់វិក្កយបត្រ
app.use("/api/admin", adminRoutes); // សម្រាប់ Admin Dashboard (ដាក់នៅទីនេះត្រឹមត្រូវ)

// 7. Start Telegram Bot Polling
if (typeof pollTelegramUpdates === "function") {
  setInterval(pollTelegramUpdates, 2000);
  console.log("🤖 Telegram Bot Polling started...");
} else {
  console.log(
    "⚠️ មិនទាន់ឃើញមុខងារ pollTelegramUpdates ដំណើរការក្នុង orderController ទេ",
  );
}

// 8. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fashion Shop Server running on port ${PORT}`);
});
