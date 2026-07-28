const Product = require("../models/Product");

// ==========================================
// PUBLIC: សម្រាប់អ្នកទិញធម្មតា
// ==========================================

// ទាញយកទំនិញទាំងអស់ (បញ្ចេញជា Array សម្រាប់ Frontend)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // ទាញយកពីថ្មីទៅចាស់
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ", error: error.message });
  }
};

// ទាញយកទំនិញតែមួយតាម ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "រកមិនឃើញទំនិញនេះទេ" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// PROTECTED: សម្រាប់តែ Admin ឬ Seller ប៉ុណ្ណោះ
// ==========================================

// បញ្ចូលទំនិញថ្មី
exports.addProduct = async (req, res) => {
  try {
    const { name, price, category, img, stock } = req.body;

    const newProduct = new Product({
      name,
      price,
      category,
      img,
      stock: stock || 0,
    });

    await newProduct.save();
    res
      .status(201)
      .json({
        success: true,
        message: "បញ្ចូលទំនិញបានជោគជ័យ!",
        data: newProduct,
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// កែប្រែទំនិញ (Update)
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body, // យកទិន្នន័យថ្មីពី Frontend ទៅជំនួស
      { new: true }, // អោយ return ទិន្នន័យថ្មីមកវិញ
    );

    if (!updatedProduct)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញទំនិញ!" });
    res.json({ success: true, message: "កែប្រែជោគជ័យ!", data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// លុបទំនិញ (Delete)
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញទំនិញនេះទេ!" });

    res.json({ success: true, message: "លុបទំនិញបានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
