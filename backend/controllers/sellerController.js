const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product"); // បងត្រូវប្រាកដថាមាន Model ទាំងនេះ
const Category = require("../models/Category");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");

// ==========================================
// Helper Function សម្រាប់ទាញយកហាង (Store) របស់អ្នកលក់
// ==========================================
const getSellerStore = async (userId) => {
  return await Store.findOne({ owner: userId });
};

// ==========================================
// 1. Profile & Settings
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const store = await getSellerStore(req.user.id); // req.user.id បានមកពី Token Middleware
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញហាងរបស់អ្នកទេ!" });

    res.status(200).json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { storeName, logoUrl, description } = req.body;
    const store = await getSellerStore(req.user.id);

    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញហាងរបស់អ្នកទេ!" });

    store.storeName = storeName || store.storeName;
    store.logoUrl = logoUrl || store.logoUrl;
    store.description = description || store.description;
    await store.save();

    res
      .status(200)
      .json({
        success: true,
        message: "ធ្វើបច្ចុប្បន្នភាពហាងបានជោគជ័យ",
        store,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPass, newPass } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!" });

    user.password = await bcrypt.hash(newPass, 10);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "ផ្លាស់ប្តូរលេខសម្ងាត់បានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. Orders Management
// ==========================================
exports.getOrders = async (req, res) => {
  try {
    const store = await getSellerStore(req.user.id);
    // ទាញយក Orders ណាដែលកុម្ម៉ង់ទំនិញពីហាងរបស់គាត់
    const orders = await Order.find({ store: store._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'new', 'packing', 'shipping', 'completed', 'cancelled'

    const store = await getSellerStore(req.user.id);

    // ត្រូវប្រាកដថា Order នោះពិតជារបស់ហាងគាត់មែន
    const order = await Order.findOneAndUpdate(
      { _id: id, store: store._id },
      { status: status },
      { new: true },
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញការកុម្ម៉ង់នេះទេ!" });

    res
      .status(200)
      .json({ success: true, message: "ផ្លាស់ប្តូរស្ថានភាពបានជោគជ័យ", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. Categories Management
// ==========================================
exports.getCategories = async (req, res) => {
  try {
    const store = await getSellerStore(req.user.id);
    const categories = await Category.find({ store: store._id });

    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const store = await getSellerStore(req.user.id);

    const newCategory = new Category({
      name,
      store: store._id, // បង្កើត Category នេះសម្រាប់តែហាងគាត់ប៉ុណ្ណោះ
    });
    await newCategory.save();

    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. Products Management
// ==========================================
exports.getProducts = async (req, res) => {
  try {
    const store = await getSellerStore(req.user.id);
    // ទាញយកផលិតផល ព្រមទាំងភ្ជាប់ឈ្មោះ Category មកជាមួយ (populate)
    const products = await Product.find({ store: store._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, imageUrl, category } = req.body;
    const store = await getSellerStore(req.user.id);

    const newProduct = new Product({
      name,
      price,
      stock,
      imageUrl, // ទទួល Link រូបភាពពី Internet តាមការស្នើសុំ
      category,
      store: store._id,
    });

    await newProduct.save();

    res
      .status(201)
      .json({
        success: true,
        message: "បន្ថែមផលិតផលបានជោគជ័យ",
        product: newProduct,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await getSellerStore(req.user.id);

    // លុបដោយឆែកមើលថា Product នោះជារបស់ហាងគាត់មែនអត់
    const deletedProduct = await Product.findOneAndDelete({
      _id: id,
      store: store._id,
    });

    if (!deletedProduct)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញផលិតផលនេះទេ!" });

    res.status(200).json({ success: true, message: "លុបផលិតផលបានជោគជ័យ" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
