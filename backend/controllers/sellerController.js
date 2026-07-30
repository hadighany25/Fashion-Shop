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
    // ស្វែងរកហាងតាមរយៈ User ID ដែលបាន Login
    const store = await Store.findOne({ owner: req.user._id });

    // បើរកមិនឃើញ (មានន័យថា Admin អត់ទាន់បង្កើតឱ្យ)
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញហាងទេ! សូមទាក់ទង Admin ដើម្បីបង្កើតហាងឱ្យអ្នក។",
      });
    }

    // បើរកឃើញ បញ្ជូនទិន្នន័យហាងទៅកាន់ Frontend
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
    // បន្ថែម paymentInfo និង categories ចូលមកក្នុងនេះ
    const { storeName, logoUrl, description, paymentInfo, categories } =
      req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user._id },
      { storeName, logoUrl, description, paymentInfo, categories }, // ដាក់ឱ្យវា Save ចូល DB
      { new: true },
    );

    res.json({ success: true, store, message: "បានកែប្រែដោយជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPass, newPass } = req.body;
    const user = await User.findById(req.user._id);

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
    const store = await Store.findOne({ owner: req.user._id });
    // ដក populate ចេញ ព្រោះឥឡូវ Category គ្រាន់តែជា String ធម្មតា
    const products = await Product.find({ store: store._id });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, imageUrl, category } = req.body;
    const store = await Store.findOne({ owner: req.user._id });

    const product = new Product({
      name,
      price,
      stock,
      imageUrl,
      category, // category ឥឡូវចូលជា String ធម្មតា
      store: store._id,
    });
    await product.save();

    res.status(201).json({ success: true, product });
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
    const store = await Store.findOne({ owner: req.user._id });
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
    const { status } = req.body; // 'packing', 'shipping', 'completed', 'cancelled'
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
