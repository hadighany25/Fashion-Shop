const mongoose = require("mongoose"); // 👈 ថែមជួរនេះ ដើម្បីយកមកឆែក ObjectId
const Order = require("../models/Order");
const Store = require("../models/Store");

// ១. បង្កើតវិក័យប័ត្រថ្មី (ដាក់អាវក្រោះការពារការគាំង ១០០%)
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

    // 🌟 ការពារទី១៖ សម្អាតទិន្នន័យទំនិញកុំឱ្យខុសទម្រង់ DB
    const formattedItems = items.map((item) => {
      const pId = item.product || item.productId || item.id;
      return {
        // បើ ID មិនត្រឹមត្រូវ ដាក់ undefined កុំឱ្យ DB គាំង (CastError)
        product: mongoose.Types.ObjectId.isValid(pId) ? pId : undefined,
        name: item.name || "ទំនិញគ្មានឈ្មោះ",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity || item.qty || 1),
        image: item.image || item.imageUrl || "https://via.placeholder.com/80",
        variant: item.variant || "",
      };
    });

    const newOrder = new Order({
      orderId,
      totalAmount: Number(totalAmount) || 0,
      items: formattedItems,
      paymentStatus: "PENDING",
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

    // 🌟 ការពារទី២៖ ពិនិត្យ buyer និង store កុំឱ្យជាប់ String ទទេ "" ដែលធ្វើឱ្យគាំង
    if (buyer && mongoose.Types.ObjectId.isValid(buyer)) {
      newOrder.buyer = buyer;
    }
    if (store && mongoose.Types.ObjectId.isValid(store)) {
      newOrder.store = store;
    }

    await newOrder.save();
    res.status(200).json({ success: true, message: "កត់ត្រាវិក័យប័ត្រជោគជ័យ" });
  } catch (error) {
    console.error("🔥 កំហុសបង្កើតវិក័យប័ត្រ:", error);

    // 🌟 ការពារទី៣៖ ចាប់ Error ជាន់លេខវិក័យប័ត្រ (Duplicate Key) ចំៗ
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        message:
          "លេខវិក័យប័ត្រនេះមានក្នុងប្រព័ន្ធរួចហើយ សូម Refresh (F5) ទំព័រនេះ!",
        detail: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "បញ្ហាក្នុងការ Save ចូល Database",
      detail: error.message, // ផ្ញើបញ្ហាពិតប្រាកដទៅឱ្យ Frontend ដឹង
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

// ==========================================
// 📌 API សម្រាប់ Seller បោះបង់ការបញ្ជាទិញ (Cancel Order)
// ==========================================
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id; // ចាប់យក _id របស់ Order ពី URL
    const { reason } = req.body; // ចាប់យកមូលហេតុពី Frontend

    // ១. ឆែកមើលថាតើគាត់បានបញ្ជាក់មូលហេតុឬអត់
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "សូមបញ្ចូលមូលហេតុនៃការបោះបង់ការបញ្ជាទិញ!",
      });
    }

    // ២. ស្វែងរក Order នៅក្នុង Database
    const order = await Order.findById(orderId); // ផ្លាស់ប្ដូរ 'Order' ទៅតាមឈ្មោះ Model របស់បង

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញការបញ្ជាទិញនេះទេ!",
      });
    }

    // ៣. (Optional) ឆែកមើលសិទ្ធិ: ការពារកុំឱ្យ Seller ម្នាក់ ទៅលុប Order របស់ Seller ផ្សេង
    // បើសិន Order Model របស់បងមាន field `seller` ឬ `store` អាចឆែកបាន៖
    // if (order.seller.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: "អ្នកគ្មានសិទ្ធិបោះបង់ Order នេះទេ!" });
    // }

    // ៤. ឆែកមើលក្រែងលោ Order នេះត្រូវបានគេ Cancel រួចហើយ
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "ការបញ្ជាទិញនេះត្រូវបានបោះបង់រួចហើយ!",
      });
    }

    // ៥. Update ស្ថានភាព និង មូលហេតុចូល Database
    order.status = "cancelled";
    order.cancelReason = reason;

    await order.save(); // Save ចូល Database

    // ៦. បោះសញ្ញាជោគជ័យទៅកាន់ Frontend វិញ
    res.status(200).json({
      success: true,
      message: "ការបញ្ជាទិញត្រូវបានបោះបង់ដោយជោគជ័យ!",
      order,
    });
  } catch (error) {
    console.error("❌ Error Cancel Order: ", error);
    res.status(500).json({
      success: false,
      message: "មានបញ្ហាបច្ចេកទេសលើ Server (500)",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  confirmReceipt,
  submitReview,
  cancelOrder,
};
