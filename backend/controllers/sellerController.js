const User = require("../models/User");
const Store = require("../models/Store");
const bcrypt = require("bcryptjs");

// ចំណាំ៖ បងត្រូវប្រាកដថាបងមាន File Models ទាំង ៣ នេះ។
// បើមិនទាន់មាន ខ្ញុំមានប្រាប់ពីរបៀបបង្កើតខ្លីៗនៅខាងក្រោម។
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");

// ==========================================
// PROFILE & SETTINGS
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    // req.user._id បានមកពី Middleware ឆែក Token
    const store = await Store.findOne({ owner: req.user._id });
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញហាងទេ!" });

    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { storeName, logoUrl, description } = req.body;

    const store = await Store.findOneAndUpdate(
      { owner: req.user._id },
      { storeName, logoUrl, description },
      { new: true }, // Return ទិន្នន័យថ្មី
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
// CATEGORIES
// ==========================================
exports.getCategories = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    const categories = await Category.find({ store: store._id });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const store = await Store.findOne({ owner: req.user._id });

    const category = new Category({ name, store: store._id });
    await category.save();

    res.status(201).json({ success: true, category });
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
    // ទាញយក Products ហើយ Populate (ភ្ជាប់) ឈ្មោះ Category មកជាមួយ
    const products = await Product.find({ store: store._id }).populate(
      "category",
      "name",
    );
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
      category,
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
