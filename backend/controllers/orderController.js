const Order = require("../models/Order");
const Store = require("../models/Store");

// ១. បង្កើតវិក័យប័ត្រថ្មី (កែសម្រួលឱ្យស៊ីគ្នា ១០០% ជាមួយ Schema ថ្មី)
const createOrder = async (req, res) => {
  try {
    const {
      orderId,
      totalAmount,
      items,
      buyer,
      store,
      shippingAddress,
      phone,
    } = req.body;

    // 🌟 ការពារសុវត្ថិភាព ទី១៖ រៀបចំទិន្នន័យទំនិញ (items) ឱ្យត្រូវប្រឡោះ Mongoose
    const formattedItems = items.map((item) => ({
      product: item.product || item.productId || item.id, // ចាប់យក ID អោយត្រូវ
      name: item.name || "ទំនិញគ្មានឈ្មោះ",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity || item.qty || 1), // ទោះ Frontend បាញ់ qty ឬ quantity ក៏ត្រូវ
      image: item.image || item.imageUrl || "https://via.placeholder.com/80",
      variant: item.variant || "",
    }));

    // បង្កើតវិក័យប័ត្រថ្មី រួច Save ចូល MongoDB
    const newOrder = new Order({
      orderId,
      totalAmount: Number(totalAmount) || 0,
      items: formattedItems, // 👈 ប្រើ Array ដែលសម្អាតរួច
      paymentStatus: "PENDING",
      buyer: buyer || null, // បើអត់មានដាក់ null ដើម្បីកុំឱ្យ CastError
      store: store || null,
      shippingAddress: shippingAddress || "មិនទាន់បញ្ជាក់",
      phone: phone || "មិនទាន់បញ្ជាក់",
      status: "pending",
      timeline: [
        {
          status: "pending",
          note: "ការបញ្ជាទិញត្រូវបានបង្កើត (រង់ចាំការទូទាត់ប្រាក់)",
        },
      ],
    });

    await newOrder.save();
    res.status(200).json({ success: true, message: "កត់ត្រាវិក័យប័ត្រជោគជ័យ" });
  } catch (error) {
    // 🌟 ការពារសុវត្ថិភាព ទី២៖ បង្ហាញ Error ច្បាស់ៗឱ្យដឹងថាមកពីអី
    console.error("កំហុសក្នុងការបង្កើតវិក័យប័ត្រ:", error.message || error);
    res.status(500).json({
      success: false,
      message: "បញ្ហាក្នុងការ Save ចូល Database",
      detail: error.message, // បោះឱ្យ Frontend ឃើញប្រវត្តិ Error
    });
  }
};

// ២. ទាញយកប្រវត្តិទិញរបស់អតិថិជន (Buyer)
const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user ? req.user.id : req.query.buyerId;

    if (!buyerId) {
      return res.status(400).json({
        success: false,
        message: "ត្រូវការលេខសម្គាល់អតិថិជន (Buyer ID)",
      });
    }

    const orders = await Order.find({ buyer: buyerId })
      .populate("store", "storeName logoUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៣. អតិថិជនចុច "បញ្ជាក់ការទទួលអីវ៉ាន់"
const confirmReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញប្រវត្តិទិញនេះទេ!" });
    }

    order.status = "completed";
    order.timeline.push({
      status: "completed",
      note: "អតិថិជនបានបញ្ជាក់ការទទួលទំនិញជោគជ័យ។",
    });

    await order.save();
    res.status(200).json({ success: true, message: "អរគុណសម្រាប់ការគាំទ្រ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ៤. អតិថិជនវាយតម្លៃហាង (Review)
const submitReview = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { rating, comment } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញ Order ទេ!" });

    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "អ្នកអាចវាយតម្លៃបាន លុះត្រាតែទទួលបានអីវ៉ាន់រួចរាល់!",
      });
    }
    if (order.isReviewed) {
      return res
        .status(400)
        .json({ success: false, message: "អ្នកបានវាយតម្លៃរួចហើយ!" });
    }

    const store = await Store.findById(order.store);
    if (store) {
      const currentTotalRatings = store.totalRatings || 0;
      const currentAverage = store.averageRating || 0;

      const newTotalRatings = currentTotalRatings + 1;
      const newAverage =
        (currentAverage * currentTotalRatings + Number(rating)) /
        newTotalRatings;

      store.averageRating = newAverage;
      store.totalRatings = newTotalRatings;
      await store.save();
    }

    order.isReviewed = true;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "ការវាយតម្លៃរបស់អ្នកត្រូវបានរក្សាទុក!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  confirmReceipt,
  submitReview,
};
