const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");

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
    const sellerId = req.user.id;

    const newWithdrawal = new Withdrawal({
      sellerId,
      amount,
      bankName: paymentInfo.bankName,
      accountName: paymentInfo.accountName,
      accountNumber: paymentInfo.accountNumber,
    });

    await newWithdrawal.save();

    res
      .status(200)
      .json({ success: true, message: "សំណើដកប្រាក់ទទួលបានជោគជ័យ" });
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
      return res
        .status(500)
        .json({
          success: false,
          message: "Server មិនទាន់បានកំណត់ API Keys ត្រឹមត្រូវទេ!",
        });
    }

    const payload = {
      merchantId: UPAY_MERCHANT_ID || "500500500500500",
      referenceId: withdrawal._id.toString(), // ប្រើ ID នេះដើម្បីចំណាំប្រវត្តិផ្ទេរប្រាក់
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

    // 🚀 កន្លែងដែលត្រូវកែ គឺប្ដូរ Endpoint ទៅជា /api/v1/b2b/transfer (ផ្ទេរប្រាក់ផ្ទាល់)
    const response = await fetch(`${UPAY_URL}/api/v1/b2b/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": UPAY_API_KEY,
        "x-timestamp": timestamp,
        "x-signature": signature,
      },
      body: payloadString,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // ជោគជ័យ កត់ត្រាទុក
      withdrawal.status = "PROCESSING";
      withdrawal.upayTransactionId = data.transactionId || "";
      withdrawal.note = "កំពុងរង់ចាំ U-Pay ដំណើរការ និងបញ្ចេញ PDF";
      await withdrawal.save();

      res
        .status(200)
        .json({
          success: true,
          message: "បានបញ្ជាផ្ទេរប្រាក់តាម U-Pay ជោគជ័យ!",
        });
    } else {
      res
        .status(400)
        .json({
          success: false,
          message: "កំហុសពី U-Pay: " + (data.message || "មិនស្គាល់បញ្ហា"),
        });
    }
  } catch (err) {
    console.error("Payout Error:", err);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស Backend" });
  }
};
