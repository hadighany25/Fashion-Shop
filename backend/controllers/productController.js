const Product = require("../models/Product");
const Store = require("../models/Store");

// ១. បន្ថែមទំនិញថ្មី (សម្រាប់តែ Seller ប៉ុណ្ណោះ)
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body;

    // ស្វែងរកហាង (Store) របស់អ្នកលក់ម្នាក់នេះសិន (ផ្អែកលើ ID ដែលបានមកពី Token)
    const store = await Store.findOne({ owner: req.user.id });

    if (!store) {
      return res
        .status(404)
        .json({
          success: false,
          message: "រកមិនឃើញហាងរបស់អ្នកទេ។ សូមទាក់ទង Admin!",
        });
    }

    if (store.status === "suspended") {
      return res
        .status(403)
        .json({
          success: false,
          message: "ហាងរបស់អ្នកត្រូវបានផ្អាកដំណើរការ (Suspended)!",
        });
    }

    // បង្កើតទំនិញ ដោយភ្ជាប់វាទៅកាន់ Store ID នោះ
    const newProduct = new Product({
      store: store._id,
      name,
      description,
      price,
      stock,
      category,
      image,
    });

    await newProduct.save();
    res
      .status(201)
      .json({
        success: true,
        message: "បន្ថែមទំនិញបានជោគជ័យ!",
        product: newProduct,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. ទាញយកទំនិញទាំងអស់ (សម្រាប់អ្នកទិញមើលនៅលើទំព័រដើម index.html)
exports.getAllProducts = async (req, res) => {
  try {
    // .populate() គឺដើម្បីទាញយកឈ្មោះហាងមកបង្ហាញជាមួយទំនិញ
    const products = await Product.find().populate("store", "storeName status");

    // ច្រោះយកតែទំនិញណាដែលហាងមាន status 'active'
    const activeProducts = products.filter(
      (p) => p.store && p.store.status === "active",
    );

    res.json({
      success: true,
      count: activeProducts.length,
      products: activeProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. ទាញយកទំនិញ តែនៅក្នុងហាងរបស់អ្នកលក់ម្នាក់ (សម្រាប់ផ្ទាំង seller-inventory.html)
exports.getSellerProducts = async (req, res) => {
  try {
    // រកហាងរបស់ Seller ហ្នឹងសិន
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: "រកហាងមិនឃើញ!" });
    }

    // រកទំនិញទាំងអស់ណាដែលមាន store ID ស្មើនឹងហាងរបស់គាត់
    const products = await Product.find({ store: store._id });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
