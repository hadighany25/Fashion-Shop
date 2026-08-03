const mongoose = require("mongoose");
const Order = require("../models/Order");
const Store = require("../models/Store");
const User = require("../models/User"); // 👈 ថែម User ដើម្បីរក Admin បញ្ចូលលុយ Commission

// ==========================================
// 📌 ១. បង្កើតវិក័យប័ត្រថ្មី (Create Order)
// ==========================================
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

    const formattedItems = items.map((item) => {
      const pId = item.product || item.productId || item.id;
      return {
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
      detail: error.message,
    });
  }
};

// ==========================================
// 📌 ២. ទាញយកប្រវត្តិទិញរបស់អតិថិជន (Buyer Get Orders)
// ==========================================
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

// ==========================================
// 📌 ៣. អតិថិជនចុច "បញ្ជាក់ការទទួលអីវ៉ាន់" (Confirm Receipt)
// ==========================================
const confirmReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញប្រវត្តិទិញនេះទេ!" });
    }

    // 🚀 ការពារកុំឱ្យគេវាយ API នេះផ្ទួនៗរួចលុយបូក ២ ដង
    if (order.status === "completed") {
      return res
        .status(400)
        .json({
          success: false,
          message: "ការបញ្ជាទិញនេះបានបញ្ជាក់រួចរាល់ហើយ!",
        });
    }

    // 🚀 បែងចែកលុយ (Commission -> Admin & Earning -> Seller)
    const store = await Store.findById(order.store);
    if (store) {
      const totalAmount = order.totalAmount;
      const commissionRate = store.commissionRate || 10;
      const commissionFee = totalAmount * (commissionRate / 100);
      const sellerEarning = totalAmount - commissionFee;

      // បញ្ចូលលុយឱ្យអ្នកលក់ និងបន្ថែមតួលេខការលក់ជោគជ័យ
      store.walletBalance += sellerEarning;
      store.totalSales = (store.totalSales || 0) + 1;
      await store.save();

      // បញ្ចូលលុយ Commission ឱ្យ Admin (Super Admin)
      const admin = await User.findOne({ role: "super_admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + commissionFee;
        await admin.save();
      }
    }

    order.status = "completed";
    order.timeline.push({
      status: "completed",
      note: "អតិថិជនបានបញ្ជាក់ការទទួលទំនិញជោគជ័យ និងប្រាក់បានវេរចូលកុងអ្នកលក់។",
    });

    await order.save();
    res.status(200).json({ success: true, message: "អរគុណសម្រាប់ការគាំទ្រ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 📌 ៤. Update Status ពីអ្នកលក់/Admin (កូដថ្មី 🚀)
// ==========================================
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញការបញ្ជាទិញទេ!" });
    }

    // ការពារកុំឱ្យបូកលុយជាន់គ្នា បើ Order នោះ Completed ស្រាប់
    if (order.status === "completed") {
      return res
        .status(400)
        .json({
          success: false,
          message: "ការបញ្ជាទិញបានបញ្ចប់រួចរាល់ហើយ មិនអាចប្ដូរបានទេ!",
        });
    }

    // 🚀 បើ Status ថ្មីជា "completed" ទើបធ្វើការបែងចែកលុយ
    if (status === "completed") {
      const store = await Store.findById(order.store);
      if (store) {
        const totalAmount = order.totalAmount;
        const commissionRate = store.commissionRate || 10;
        const commissionFee = totalAmount * (commissionRate / 100);
        const sellerEarning = totalAmount - commissionFee;

        // បញ្ចូលលុយឱ្យអ្នកលក់
        store.walletBalance += sellerEarning;
        store.totalSales = (store.totalSales || 0) + 1;
        await store.save();

        // បញ្ចូលលុយឱ្យ Admin
        const admin = await User.findOne({
          role: { $in: ["super_admin", "admin"] },
        });
        if (admin) {
          admin.walletBalance = (admin.walletBalance || 0) + commissionFee;
          await admin.save();
        }
      }
    }

    order.status = status;
    order.timeline.push({
      status: status,
      date: new Date(),
      note:
        status === "completed"
          ? "ការបញ្ជាទិញជោគជ័យ និងប្រាក់បានផ្ទេរចូលកុងអ្នកលក់"
          : `បានផ្លាស់ប្ដូរស្ថានភាពទៅជា ${status}`,
    });

    await order.save();
    res.status(200).json({ success: true, message: "កែប្រែស្ថានភាពជោគជ័យ!" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាបច្ចេកទេសលើ Server" });
  }
};

// ==========================================
// 📌 ៥. អតិថិជនវាយតម្លៃហាង (Submit Review)
// ==========================================
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
// 📌 ៦. API សម្រាប់បោះបង់ការបញ្ជាទិញ (Cancel Order)
// ==========================================
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "សូមបញ្ចូលមូលហេតុនៃការបោះបង់ការបញ្ជាទិញ!",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញការបញ្ជាទិញនេះទេ!",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "ការបញ្ជាទិញនេះត្រូវបានបោះបង់រួចហើយ!",
      });
    }

    order.status = "cancelled";
    order.cancelReason = reason;

    await order.save();

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

// ==========================================
// 📌 ៧. ចងក្រងនិង Export មុខងារទាំងអស់
// ==========================================
module.exports = {
  createOrder,
  getMyOrders,
  confirmReceipt,
  updateOrderStatus, // 👈 Export មុខងារថ្មី
  submitReview,
  cancelOrder,
};
