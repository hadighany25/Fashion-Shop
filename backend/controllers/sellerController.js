const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const Order = require("../models/Order");

// ==========================================
// PROFILE & SETTINGS
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    // ធានាថាទាញយក ID បានត្រឹមត្រូវទោះ Middleware បោះមកជា id ឬ _id
    const userId = req.user.id || req.user._id;
    console.log("🔍 កំពុងស្វែងរកហាងសម្រាប់ User ID:", userId);

    const store = await Store.findOne({ owner: userId });

    if (!store) {
      console.log("❌ រកមិនឃើញហាងសម្រាប់ User ID:", userId);
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញហាងទេ! សូមទាក់ទង Admin ដើម្បីបង្កើតហាងឱ្យអ្នក។",
      });
    }

    console.log("✅ រកឃើញហាង:", store.storeName);
    res.json({ success: true, store });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាបច្ចេកទេសលើ Server" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      storeName,
      logoUrl,
      coverUrl,
      description,
      paymentInfo,
      categories,
    } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: userId },
      { storeName, logoUrl, coverUrl, description, paymentInfo, categories },
      { new: true },
    );

    res.json({ success: true, store, message: "បានកែប្រែដោយជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { oldPass, newPass } = req.body;
    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវ!" });

    user.password = await bcrypt.hash(newPass, 10);
    await user.save();

    res.json({ success: true, message: "ប្ដូរលេខសម្ងាត់ជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PRODUCTS
// ==========================================
exports.getProducts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const store = await Store.findOne({ owner: userId });

    if (!store) return res.json({ success: true, products: [] });

    const products = await Product.find({ store: store._id });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, price, stock, imageUrl, category } = req.body;
    const store = await Store.findOne({ owner: userId });

    const product = new Product({
      name,
      price,
      stock,
      imageUrl,
      category,
      store: store._id,
    });
    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// បន្ថែមនៅពីលើ exports.deleteProduct
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, stock, imageUrl, category } = req.body;

    // ស្វែងរកទំនិញតាម ID រួច Update ទិន្នន័យថ្មី
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, stock, imageUrl, category },
      { new: true }, // ឱ្យវា Return យកទិន្នន័យថ្មីដែលទើបកែរួច
    );

    res.json({ success: true, product, message: "បានកែប្រែដោយជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "បានលុបជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ORDERS
// ==========================================
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const store = await Store.findOne({ owner: userId });

    if (!store) return res.json({ success: true, orders: [] });

    const orders = await Order.find({ store: store._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
