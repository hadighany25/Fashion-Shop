const Order = require("../models/Order");
const Product = require("../models/Product");

// ==========================================
// BUYER: សម្រាប់អ្នកទិញ
// ==========================================

// ១. បង្កើតការបញ្ជាទិញថ្មី (Checkout)
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, address } = req.body;

    // បង្កើតវិក្កយបត្រថ្មី ដោយភ្ជាប់ជាមួយ User ID ពី Token
    const newOrder = new Order({
      user: req.user._id,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "Cash On Delivery",
      address,
      status: "Pending", // រង់ចាំការយល់ព្រម ឬការបង់ប្រាក់
    });

    await newOrder.save();

    // មុខងារពិសេស: កាត់ស្តុកចេញពី Database តាមចំនួនដែលទិញ
    for (let item of items) {
      if (item.id || item.product) {
        await Product.findByIdAndUpdate(item.id || item.product, {
          $inc: { stock: -item.qty }, // ដកចំនួន qty ចេញពីស្តុក
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "បញ្ជាទិញបានជោគជ័យ!",
      orderId: newOrder._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. ទាញយកប្រវត្តិទិញរបស់អ្នកប្រើប្រាស់ (ខ្លួនឯង)
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. ឆែកមើលស្ថានភាព Order មួយ (ងាយស្រួលពេលភ្ជាប់ជាមួយ Upay)
exports.checkOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, status: order.status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADMIN/SELLER: សម្រាប់អ្នកលក់
// ==========================================

// ៤. ទាញយកវិក្កយបត្ររបស់ភ្ញៀវទាំងអស់
exports.getAllOrders = async (req, res) => {
  try {
    // ប្រើ .populate ដើម្បីទាញយកឈ្មោះអ្នកទិញមកបង្ហាញ
    const orders = await Order.find()
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៥. កែប្រែស្ថានភាពវិក្កយបត្រ (Pending -> Success -> Cancelled)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );

    if (!updatedOrder)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញ Order នេះទេ" });

    // (បន្ថែម): ប្រសិនបើលុបចោល (Cancelled) យើងគួរតែបូកស្តុកអោយវិញ
    if (status === "Cancelled") {
      for (let item of updatedOrder.items) {
        if (item.id || item.product) {
          await Product.findByIdAndUpdate(item.id || item.product, {
            $inc: { stock: item.qty }, // បូកចូលវិញ
          });
        }
      }
    }

    res.json({
      success: true,
      message: "ផ្លាស់ប្តូរស្ថានភាពជោគជ័យ",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
