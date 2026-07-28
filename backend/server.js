require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// 1. Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// 2. Import Controller for Telegram Bot
const { pollTelegramUpdates } = require("./controllers/orderController");

const app = express();

// 3. Middleware
app.use(express.json());
app.use(cors());

// 4. Connect Database
connectDB();

// 5. បម្រើឯកសារ Static (Frontend នៅក្នុង Folder public)
// រាល់ឯកសារ html ទាំងអស់នឹងអាចបើកមើលបានតាមរយៈ URL ផ្ទាល់
app.use(express.static(path.join(__dirname, "public")));

// 6. Set up API Routes (កែសម្រួលកុំឱ្យ Path ជាន់គ្នា)
app.use("/api/auth", authRoutes); // សម្រាប់ Login/Register (ឧ. /api/auth/login)
app.use("/api/products", productRoutes); // សម្រាប់ទំនិញ (ឧ. /api/products)
app.use("/api/orders", orderRoutes); // សម្រាប់វិក្កយបត្រ (ឧ. /api/orders)

// 7. Start Telegram Bot Polling (ដាក់លក្ខខណ្ឌការពារក្រែងលោត Error)
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
