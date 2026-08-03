const User = require("../models/User");
const Store = require("../models/Store");
const Withdrawal = require("../models/Withdrawal");
// 👇 ត្រូវ Import Model ទាំង ២ នេះបន្ថែម ដើម្បីយកមកគណនាលុយ និង ទំនិញក្នុង Dashboard
const Order = require("../models/Order");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

// ==========================================
// ១. ទាញយកអ្នកប្រើប្រាស់ទាំងអស់
// ==========================================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ២. បង្កើតគណនី និងហាងព្រមគ្នា
// ==========================================
exports.createUserAndStore = async (req, res) => {
  try {
    const { username, password, role, phone, email, storeName, storeCategory } =
      req.body;

    // ឆែកមើលក្រែងលោមានអ្នកប្រើឈ្មោះនេះរួចហើយ
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Username នេះមានគេប្រើរួចហើយ!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // បង្កើតគណនីថ្មី
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "buyer",
      phone: phone || undefined,
      email: email || undefined,
    });
    await newUser.save();

    // បើគណនីនោះជា Seller យើងបង្កើតហាង (Store) ឱ្យគាត់ដោយស្វ័យប្រវត្តិ
    if (newUser.role === "seller") {
      if (!storeName || !storeCategory) {
        // បើអត់មានឈ្មោះហាង យើងលុបគណនីវិញ ដើម្បីកុំឱ្យខូចទិន្នន័យ
        await User.findByIdAndDelete(newUser._id);
        return res.status(400).json({
          success: false,
          message: "ត្រូវតែមានឈ្មោះហាង និងប្រភេទហាងសម្រាប់ Seller!",
        });
      }

      const newStore = new Store({
        owner: newUser._id,
        storeName,
        storeCategory,
      });
      await newStore.save();
    }

    res
      .status(201)
      .json({ success: true, message: "បង្កើតគណនីបានជោគជ័យ!", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ៣. លុបគណនី
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញគណនីនេះទេ!" });

    // បើជា seller ត្រូវលុបហាងចោលដែរ
    if (user.role === "seller") {
      await Store.findOneAndDelete({ owner: user._id });
    }
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "លុបបានជោគជ័យ!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ៤. ទាញយកហាងទាំងអស់ (សម្រាប់ Store Management)
// ==========================================
exports.getStores = async (req, res) => {
  try {
    // populate('owner') ដើម្បីទាញយក username, phone, email ពី User មកបង្ហាញជាមួយ Store
    const stores = await Store.find()
      .populate("owner", "username phone email status")
      .sort({ createdAt: -1 });
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ៥. ទាញយកប្រវត្តិដកប្រាក់ទាំងអស់មកបង្ហាញ Admin
// ==========================================
exports.getAllWithdrawals = async (req, res) => {
  try {
    // ទាញយកសំណើទាំងអស់ រៀបតាមថ្ងៃថ្មីៗបំផុត (createdAt: -1)
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      withdrawals: withdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res
      .status(500)
      .json({ success: false, message: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ!" });
  }
};

// ==========================================
// 🚀 ៦. (មុខងារថ្មី) ទាញយកទិន្នន័យស្ថិតិពិតប្រាកដសម្រាប់ Dashboard ទាំង ១៨ ប្រអប់
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    // ---- ផ្នែកទី ១៖ ទិន្នន័យ User និង ហាង ----
    const totalBuyers = await User.countDocuments({ role: "buyer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalAdmins = await User.countDocuments({
      role: { $in: ["admin", "super_admin"] },
    });
    const bannedUsers = await User.countDocuments({ status: "banned" }); // សន្មត់ថាមាន field status

    // រកហាងដែលបិទ ឬ ផ្អាកដំណើរការ
    const inactiveStores = await Store.countDocuments({
      status: { $ne: "active" },
    });

    // រកអ្នកប្រើប្រាស់ថ្មីក្នុងខែនេះ
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const newUsersMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ---- ផ្នែកទី ២៖ ទិន្នន័យទំនិញ និង ការបញ្ជាទិញ ----
    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });

    // អាចប្រើលក្ខខណ្ឌ isFlashSale: true បើបងមានក្នុង Schema
    const flashSaleItems = await Product.countDocuments({ isFlashSale: true });

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const completedOrders = await Order.countDocuments({ status: "completed" });

    // ---- ផ្នែកទី ៣៖ ទិន្នន័យហិរញ្ញវត្ថុ (គណនាពី DB ផ្ទាល់តាមរយៈ Aggregation) ----

    // គណនាចំណូលសរុប (Gross Revenue) ពី Order ជោគជ័យទាំងអស់
    const revenueData = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalGross: { $sum: "$totalAmount" } } },
    ]);
    const grossRevenue = revenueData.length > 0 ? revenueData[0].totalGross : 0;

    // គណនាកុង (សន្មត់ថា Admin កាត់ ១០%)
    const totalCommission = grossRevenue * 0.1;
    const netRevenue = grossRevenue - totalCommission;

    // គណនាប្រាក់ដែលបានទូទាត់ឲ្យហាងសរុប (Total Payouts) ពី Withdrawals ជោគជ័យ
    const payoutData = await Withdrawal.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, totalPayout: { $sum: "$amount" } } },
    ]);
    const totalPayout = payoutData.length > 0 ? payoutData[0].totalPayout : 0;

    // គណនាទឹកប្រាក់បង្វិល (Refunds) - សន្មត់ថា Order មាន status 'refunded'
    const refundData = await Order.aggregate([
      { $match: { status: "refunded" } },
      { $group: { _id: null, totalRefund: { $sum: "$totalAmount" } } },
    ]);
    const totalRefunds = refundData.length > 0 ? refundData[0].totalRefund : 0;

    const pendingWithdrawals = await Withdrawal.countDocuments({
      status: "PENDING",
    });

    // ផ្ញើទិន្នន័យទាំងអស់ទៅកាន់ Frontend
    res.status(200).json({
      success: true,
      stats: {
        totalBuyers,
        totalSellers,
        totalAdmins,
        inactiveStores,
        newUsersMonth,
        bannedUsers,

        grossRevenue,
        netRevenue,
        totalCommission,
        pendingWithdrawals,
        totalPayout,
        totalRefunds,

        totalProducts,
        outOfStock,
        flashSaleItems,
        totalOrders,
        pendingOrders,
        completedOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error មិនអាចទាញទិន្នន័យបានទេ" });
  }
};
