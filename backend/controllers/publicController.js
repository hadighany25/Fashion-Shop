const Product = require("../models/Product"); // ត្រូវប្រាកដថាបងមាន Product Model
const Store = require("../models/Store");

exports.getAllPublicProducts = async (req, res) => {
  try {
    // ទាញយកផលិតផលទាំងអស់ ហើយភ្ជាប់ជាមួយព័ត៌មានហាង (Store)
    const products = await Product.find()
      .populate("store", "storeName logoUrl") // ទាញយកតែឈ្មោះ និងឡូហ្គោហាង
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
