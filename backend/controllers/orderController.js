const Order = require("../models/Order");
const Store = require("../models/Store");
const Product = require("../models/Product");

// ១. បង្កើតការកុម្ម៉ង់ទិញថ្មី (សម្រាប់ Buyer ឬ Guest មិនបាន Login ក៏អាចទិញបាន)
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
      paymentMethod,
    } = req.body;

    // បើសិនជាគាត់បាន Login នោះ req.user នឹងមានទិន្នន័យ
    const buyerId = req.user ? req.user.id : null;

    const newOrder = new Order({
      buyer: buyerId,
      customerName,
      customerPhone,
      customerAddress,
      items, // ទិន្នន័យ array ដែលបញ្ជូនពី Frontend (មាន product, store, quantity, price)
      totalAmount,
      paymentMethod,
    });

    await newOrder.save();

    // ជម្រើសបន្ថែម៖ កាត់ស្តុកចេញពីទំនិញ (Stock deduction)
    for (let item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }, // ដកចំនួនស្តុកតាមចំនួនដែលគេទិញ
      });
    }

    res
      .status(201)
      .json({
        success: true,
        message: "ការបញ្ជាទិញទទួលបានជោគជ័យ!",
        order: newOrder,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ២. ទាញយកការកុម្ម៉ង់របស់អតិថិជនខ្លួនឯង (សម្រាប់ប្រវត្តិទិញ - history.html)
exports.getMyOrders = async (req, res) => {
  try {
    // រកមើលតែវិក្កយបត្រណាដែលមាន ID ស្មើនឹង ID របស់ Buyer ដែលបាន Login
    const orders = await Order.find({ buyer: req.user.id }).populate(
      "items.product",
      "name image",
    );
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. ទាញយកការកុម្ម៉ង់ តែសម្រាប់ហាងអ្នកលក់ម្នាក់ៗ (Seller មើលឃើញតែអីវ៉ាន់ហាងខ្លួនឯងដែលមានគេទិញ)
exports.getSellerOrders = async (req, res) => {
  try {
    // រកហាងរបស់ Seller ហ្នឹងសិន
    const store = await Store.findOne({ owner: req.user.id });
    if (!store) {
      return res.status(404).json({ success: false, message: "រកហាងមិនឃើញ!" });
    }

    // រកមើលវិក្កយបត្រណា ដែលនៅក្នុងបញ្ជីទំនិញ (items) មានផ្ទុក ID ហាងរបស់គាត់
    const orders = await Order.find({ "items.store": store._id }).populate(
      "items.product",
      "name price",
    );

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៤. អាប់ដេតស្ថានភាពវិក្កយបត្រ (ឧទាហរណ៍៖ ពី pending ទៅ shipped)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }, // ត្រឡប់ទិន្នន័យថ្មីមកវិញបន្ទាប់ពី Update រួច
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញវិក្កយបត្រនេះទេ!" });
    }

    res.json({
      success: true,
      message: "បានកែប្រែស្ថានភាពវិក្កយបត្រ!",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
