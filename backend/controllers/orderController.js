const Order = require("../models/Order");
const Store = require("../models/Store"); // បន្ថែម Store Model សម្រាប់ពេលអតិថិជនវាយតម្លៃ (Review)

// ១. បង្កើតវិក័យប័ត្រថ្មី (រក្សាកូដចាស់ ១០០% បូកបញ្ចូលទិន្នន័យ E-commerce)
const createOrder = async (req, res) => {
  try {
    // ចាប់យកទិន្នន័យចាស់ (Payment) និងទិន្នន័យថ្មី (E-commerce) ពី Frontend
    const {
      orderId,
      totalAmount,
      items,
      buyer,
      store,
      shippingAddress,
      phone,
    } = req.body;

    // បង្កើតវិក័យប័ត្រថ្មី រួច Save ចូល MongoDB
    const newOrder = new Order({
      // -- ផ្នែកចាស់ (Payment) មិនប៉ះពាល់ --
      orderId,
      totalAmount,
      items,
      paymentStatus: "PENDING",

      // -- ផ្នែកថ្មីដែលទើបបន្ថែម (Order Management) --
      buyer,
      store,
      shippingAddress,
      phone,
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
    console.error("កំហុសក្នុងការបង្កើតវិក័យប័ត្រ:", error);
    res
      .status(500)
      .json({ success: false, message: "បញ្ហាក្នុងការ Save ចូល Database" });
  }
};

// ២. ទាញយកប្រវត្តិទិញរបស់អតិថិជន (Buyer)
const getMyOrders = async (req, res) => {
  try {
    // ករណីបងមាន Middleware ចាប់ Token វាអាចនៅ req.user.id តែបើអត់ទេ អាចចាប់ពី Query URL សិន
    const buyerId = req.user ? req.user.id : req.query.buyerId;

    if (!buyerId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ត្រូវការលេខសម្គាល់អតិថិជន (Buyer ID)",
        });
    }

    const orders = await Order.find({ buyer: buyerId })
      .populate("store", "storeName logoUrl") // ទាញយកឈ្មោះ និង Logo ហាងមកបង្ហាញ
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

    // ប្តូរ Status ទៅជា Completed
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
      return res
        .status(400)
        .json({
          success: false,
          message: "អ្នកអាចវាយតម្លៃបាន លុះត្រាតែទទួលបានអីវ៉ាន់រួចរាល់!",
        });
    }
    if (order.isReviewed) {
      return res
        .status(400)
        .json({ success: false, message: "អ្នកបានវាយតម្លៃរួចហើយ!" });
    }

    // អាប់ដេតផ្កាយចូលហាង (Store)
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

// ត្រូវប្រាកដថាបាន Export មុខងារទាំងអស់ចេញ
module.exports = {
  createOrder,
  getMyOrders,
  confirmReceipt,
  submitReview,
};
