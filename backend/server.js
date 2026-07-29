const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

// កែតម្រូវទី១៖ កុំឱ្យ dotenv ដំណើរការរំខាននៅលើ Fly.io
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ១. ទាញយក Routes ដែលយើងបានសរសេរ
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sellerRoutes = require("./routes/sellerRoutes");

// ២. ទាញយក User Model សម្រាប់បង្កើត Super Admin
const User = require("./models/User");

const app = express();

// ៣. Middleware សំខាន់ៗសម្រាប់ Server
app.use(cors()); // អនុញ្ញាតឱ្យ Frontend អាចហៅ API បាន
app.use(express.json()); // អនុញ្ញាតឱ្យ Server ស្គាល់ទិន្នន័យប្រភេទ JSON
app.use(express.urlencoded({ extended: true }));

// បម្រើឯកសារ Frontend (HTML/CSS/JS) ដែលនៅក្នុង Folder 'public'
app.use(express.static(path.join(__dirname, "public")));

// ៤. ភ្ជាប់ Routes ទាំងអស់ទៅកាន់ API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);

// ៥. ការតភ្ជាប់ទៅកាន់ Database (MongoDB)
// កែតម្រូវទី២៖ ប្ដូរពី MONGODB_URI ទៅជា MONGO_URI ឱ្យត្រូវជាមួយ Fly Secrets
const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fashion_shop_db";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ បានភ្ជាប់ទៅកាន់ MongoDB ដោយជោគជ័យ!");
    createSuperAdmin(); // ហៅ Function បង្កើត Super Admin ពេលភ្ជាប់ DB ជោគជ័យ
  })
  .catch((err) => {
    console.error("❌ បរាជ័យក្នុងការភ្ជាប់ MongoDB:", err);
  });

// ៦. Function សម្រាប់បង្កើត Super Admin ដោយស្វ័យប្រវត្តិ
const createSuperAdmin = async () => {
  try {
    // ឆែកមើលថាតើមាន Super Admin ក្នុងប្រព័ន្ធហើយឬនៅ?
    const adminExists = await User.findOne({ role: "super_admin" });

    if (!adminExists) {
      // បើអត់ទាន់មានទេ យើងបង្កើតថ្មីមួយ
      const hashedPassword = await bcrypt.hash("superadmin123", 10); // លេខសម្ងាត់ដើម
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

// ៧. កំណត់ Port សម្រាប់ដំណើរការ Server
const PORT = process.env.PORT || 3000;

// កែតម្រូវទី៣៖ បន្ថែម "0.0.0.0" ដើម្បីកុំឱ្យ Fly.io បដិសេធការភ្ជាប់ (Refused Connection)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server កំពុងដំណើរការយ៉ាងរលូននៅលើ Port: ${PORT}`);
});
