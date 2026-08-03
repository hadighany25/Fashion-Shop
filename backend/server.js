const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

// =====================================================================
// 🌟 ១. ការកំណត់បរិស្ថាន (Environment & Process Settings)
// =====================================================================
// កុំឱ្យ dotenv ដំណើរការរំខាននៅលើ Fly.io (Production)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// =====================================================================
// 🌟 ២. ការទាញយក Routes និង Models (Imports)
// =====================================================================
// -- បណ្តាញចាស់ៗ (Existing Routes) --
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const publicRoutes = require("./routes/publicRoutes");
const settingRoutes = require("./routes/settingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");

// -- បណ្តាញថ្មីសម្រាប់ប្រព័ន្ធ Payout & Escrow (New Routes) --
const payoutRoutes = require("./routes/payoutRouter");
const webhookRoutes = require("./routes/webhookRouter");

// ទាញយក User Model សម្រាប់បង្កើត Super Admin
const User = require("./models/User");

// =====================================================================
// 🌟 ៣. ការបង្កើត Server & Middleware (App Initialization)
// =====================================================================
const app = express();

app.use(cors()); // អនុញ្ញាតឱ្យ Frontend អាចហៅ API បាន
app.use(express.json()); // អនុញ្ញាតឱ្យ Server ស្គាល់ទិន្នន័យប្រភេទ JSON
app.use(express.urlencoded({ extended: true }));

// បម្រើឯកសារ Frontend (HTML/CSS/JS) ដែលនៅក្នុង Folder 'public'
app.use(express.static(path.join(__dirname, "public")));

// =====================================================================
// 🌟 ៤. ការភ្ជាប់ Routes ទៅកាន់ API Endpoints (API Routing)
// =====================================================================
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userRoutes);

// -- ភ្ជាប់ Routes ថ្មីសម្រាប់ Payout ចូល --
app.use("/api/payout", payoutRoutes);
app.use("/api/webhook", webhookRoutes);

// =====================================================================
// 🌟 ៥. ការតភ្ជាប់ទៅកាន់ Database (MongoDB Connection)
// =====================================================================
// លុប Localhost ចោល ប្រើតែ process.env.MONGO_URI សម្រាប់ Production
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error(
    "❌ មិនមាន MONGO_URI នៅក្នុង Environment Variables ទេ! Server មិនអាចដំណើរការបានឡើយ។",
  );
  process.exit(1); // បញ្ឈប់ Server ប្រសិនបើមិនមាន Database URL
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ បានភ្ជាប់ទៅកាន់ MongoDB ដោយជោគជ័យ!");
    createSuperAdmin(); // ហៅ Function បង្កើត Super Admin ពេលភ្ជាប់ DB ជោគជ័យ
  })
  .catch((err) => {
    console.error("❌ បរាជ័យក្នុងការភ្ជាប់ MongoDB:", err);
  });

// =====================================================================
// 🌟 ៦. អនុគមន៍ជំនួយ (Helper Functions)
// =====================================================================
// Function សម្រាប់បង្កើត Super Admin ដោយស្វ័យប្រវត្តិ
const createSuperAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "super_admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("superadmin123", 10);
      const superAdmin = new User({
        username: "superadmin",
        password: hashedPassword,
        role: "super_admin",
      });
      await superAdmin.save();
      console.log("👑 គណនី Super Admin ត្រូវបានបង្កើតដោយស្វ័យប្រវត្តិ!");
      console.log("👉 ឈ្មោះគណនី: superadmin | លេខសម្ងាត់: superadmin123");
    } else {
      console.log("👑 គណនី Super Admin មានរួចរាល់ហើយនៅក្នុងប្រព័ន្ធ។");
    }
  } catch (error) {
    console.error("❌ មានបញ្ហាក្នុងការបង្កើត Super Admin:", error);
  }
};

// =====================================================================
// 🌟 ៧. ដំណើរការ Server (Start Application)
// =====================================================================
const PORT = process.env.PORT || 3000;

// បន្ថែម "0.0.0.0" ដើម្បីកុំឱ្យ Fly.io បដិសេធការភ្ជាប់ (Refused Connection)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server កំពុងដំណើរការយ៉ាងរលូននៅលើ Port: ${PORT}`);
});
