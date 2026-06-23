require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Import Controller for Telegram Bot
const { pollTelegramUpdates } = require("./controllers/orderController");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// បន្ទាត់កូដថ្មី
app.use(express.static(path.join(__dirname, "public")));
// Set up API Routes
app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);

// Start Telegram Bot Polling
setInterval(pollTelegramUpdates, 2000);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fashion Shop Server running on port ${PORT}`);
});
