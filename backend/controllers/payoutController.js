const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const Store = require("../models/Store"); // 👈 ទី១៖ ត្រូវ Import Store ចូលមក

const UPAY_API_KEY = process.env.UPAY_API_KEY;
const UPAY_SECRET = process.env.UPAY_API_SECRET;
const UPAY_URL = process.env.UPAY_BASE_URL;
const UPAY_MERCHANT_ID = process.env.UPAY_MERCHANT_ID;

// ==========================================
// ១. Seller ស្នើសុំដកប្រាក់
// ==========================================
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentInfo } = req.body;
    const sellerId = req.user.id; // ទាញពី Token

    // 🚀 ការពារទី១៖ ត្រូវប្រាកដថាចំនួនទឹកប្រាក់ធំជាង ០
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ!" });
    }

    // 🚀 ការពារទី២៖ រកមើលហាងរបស់គាត់
    const store = await Store.findOne({ owner: sellerId });
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "មិនអាចស្វែងរកហាងរបស់អ្នកបានទេ!" });
    }

    // 🚀 ការពារទី៣៖ ឆែកមើលលុយពិតប្រាកដក្នុង Database តើមានគ្រប់ដកឬអត់?
    if (store.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "ទឹកប្រាក់ក្នុងកាបូបរបស់អ្នកមិនគ្រប់គ្រាន់ទេ!",
      });
    }

    // 🚀 អាគមសំខាន់៖ កាត់លុយចេញពី Wallet ភ្លាមៗ!
    // (លុយនេះក្លាយជាលុយជាប់គាំង PENDING ពេល Admin ចុច Approve ទើបបាត់ឈឹង បើ Admin ចុច Reject ត្រូវបូកសងវិញ)
    store.walletBalance -= amount;
    await store.save();

    // បង្កើតសំណើដកប្រាក់
    const newWithdrawal = new Withdrawal({
      sellerId,
      amount,
      bankName: paymentInfo.bankName,
      accountName: paymentInfo.accountName,
      accountNumber: paymentInfo.accountNumber,
    });

    await newWithdrawal.save();

    res.status(200).json({
      success: true,
      message: "សំណើដកប្រាក់ទទួលបានជោគជ័យ និងបានកាត់ចេញពីគណនី!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ==========================================
// ២. Admin អនុម័ត និងបញ្ជាទៅ U-Pay (ផ្ទេរប្រាក់)
// ==========================================
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "សំណើនេះមិនត្រឹមត្រូវ!" });
    }

    if (!UPAY_API_KEY || !UPAY_SECRET || !UPAY_URL) {
      return res.status(500).json({
        success: false,
        message: "Server មិនទាន់បានកំណត់ API Keys ត្រឹមត្រូវទេ!",
      });
    }

    const payload = {
      merchantId: UPAY_MERCHANT_ID || "500500500500500",
      referenceId: withdrawal._id.toString(),
      amount: withdrawal.amount,
      receiverAccount: withdrawal.accountNumber,
      description: `U-Mall Payout for Seller`,
    };

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();

    const dataToSign = payloadString + timestamp;
    const signature = crypto
      .createHmac("sha256", UPAY_SECRET)
      .update(dataToSign)
      .digest("hex");

    // 🚀 កែ Endpoint ឲ្យត្រូវនឹង server.js របស់ U-Pay ជាក់ស្ដែង
    const response = await fetch(`${UPAY_URL}/api/b2b/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": UPAY_API_KEY,
        "x-timestamp": timestamp,
        "x-signature": signature,
      },
      body: payloadString,
    });

    // 🛡️ អាគមការពារ Crash: អានទិន្នន័យជា Text សិន ដើម្បីការពារពេល U-Pay បោះ HTML មកវិញ
    const responseText = await response.text();
    let data;

    try {
      // ព្យាយាមបំប្លែងទៅជា JSON
      data = JSON.parse(responseText);
    } catch (parseError) {
      // បើបំប្លែងមិនចេញ (មានន័យថា U-Pay បោះ HTML មក)
      console.error(
        "❌ U-Pay បោះមកមិនមែនជា JSON ទេ! (ប្រហែលខុស Endpoint) លទ្ធផល:",
        responseText.substring(0, 150),
      );
      return res.status(500).json({
        success: false,
        message:
          "ប្រព័ន្ធ U-Pay ឆ្លើយតបខុសប្រក្រតី (អាចនឹងខុស Endpoint ផ្ទេរប្រាក់)",
      });
    }

    // ដំណើរការបន្តបើបំប្លែង JSON បានជោគជ័យ
    if (response.ok && data.success) {
      withdrawal.status = "COMPLETED"; // ✅ ដូរមក COMPLETED វិញ
      withdrawal.upayTransactionId = data.transactionId || "";
      withdrawal.note = "ការផ្ទេរប្រាក់ជោគជ័យតាមប្រព័ន្ធ U-Pay";
      await withdrawal.save();

      res.status(200).json({
        success: true,
        message: "បានបញ្ជាផ្ទេរប្រាក់តាម U-Pay ជោគជ័យ!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "កំហុសពី U-Pay: " + (data.message || "មិនស្គាល់បញ្ហា"),
      });
    }
  } catch (err) {
    console.error("Payout Error:", err);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស Backend" });
  }
};

// ==========================================
// ៣. Admin បដិសេធសំណើដកប្រាក់ (Reject Withdrawal)
// ==========================================
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body; // Admin អាចបញ្ជាក់មូលហេតុ (ឧ. "លេខកុងធនាគារមិនត្រឹមត្រូវ")

    // ១. ស្វែងរកប្រវត្តិដកប្រាក់
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "សំណើនេះមិនត្រឹមត្រូវ ឬត្រូវបានដោះស្រាយរួចរាល់ហើយ!",
      });
    }

    // ២. ស្វែងរកហាងរបស់អ្នកលក់ ដើម្បីសងប្រាក់ត្រលប់វិញ
    const store = await Store.findOne({ owner: withdrawal.sellerId });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញគណនីហាងរបស់អ្នកលក់ដើម្បីសងប្រាក់វិញទេ!",
      });
    }

    // 🚀 ៣. អាគមសំខាន់៖ បូកប្រាក់សងចូលក្នុង Wallet របស់ Seller វិញ
    store.walletBalance += withdrawal.amount;
    await store.save();

    // ៤. ធ្វើបច្ចុប្បន្នភាពស្ថានភាពសំណើទៅជា REJECTED
    withdrawal.status = "REJECTED";
    withdrawal.note = reason || "សំណើដកប្រាក់ត្រូវបានបដិសេធដោយ Admin";
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message:
        "បានបដិសេធសំណើ និងបានសងប្រាក់ចូលកាបូប (Wallet) អ្នកលក់វិញជោគជ័យ!",
    });
  } catch (err) {
    console.error("❌ Reject Payout Error:", err);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស Backend" });
  }
};
