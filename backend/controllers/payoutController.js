const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User"); // Seller Model

// សោសម្ងាត់របស់ U-Mall (ត្រូវដូចគ្នានឹងអ្វីដែល U-Pay បានផ្តល់ឱ្យ)
const UPAY_API_KEY = process.env.UPAY_API_KEY || "UMALL_KEY_123";
const UPAY_SECRET = process.env.UPAY_SECRET || "UMALL_SECRET_456";
const UPAY_URL = process.env.UPAY_URL || "https://u-pay-bank.fly.dev";

// ==========================================
// ១. Seller ស្នើសុំដកប្រាក់ (ទាញពី Frontend)
// ==========================================
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentInfo } = req.body;
    const sellerId = req.user.id; // យកពី Token

    // បង្កើត Record រង់ចាំ Admin ពិនិត្យ
    const newWithdrawal = new Withdrawal({
      sellerId,
      amount,
      bankName: paymentInfo.bankName,
      accountName: paymentInfo.accountName,
      accountNumber: paymentInfo.accountNumber,
    });

    await newWithdrawal.save();

    // ចំណាំ៖ នៅទីនេះបងគួរតែកាត់លុយចេញពី Wallet របស់ Seller
    // ដើម្បីកុំឱ្យគាត់សុំដកលុយដដែលៗបាន (Freeze Balance)

    res
      .status(200)
      .json({ success: true, message: "សំណើដកប្រាក់ទទួលបានជោគជ័យ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// ២. Admin អនុម័ត និងបញ្ជាទៅ U-Pay
// ==========================================
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res
        .status(400)
        .json({
          success: false,
          message: "សំណើនេះមិនត្រឹមត្រូវ ឬបានចាត់ចែងរួចហើយ!",
        });
    }

    // ១. រៀបចំ Data សម្រាប់ U-Pay Escrow Release
    const payload = {
      apiKey: UPAY_API_KEY,
      orderId: withdrawal._id.toString(), // ប្រើ ID នេះដើម្បីស្រួលចំណាំពេល Webhook តបមកវិញ
      amount: withdrawal.amount,
      receiverAccount: withdrawal.accountNumber,
      description: `U-Mall Payout for Seller`,
    };

    const payloadString = JSON.stringify(payload);

    // ២. បង្កើត HMAC-SHA256 Signature ការពារសុវត្ថិភាព
    const signature = crypto
      .createHmac("sha256", UPAY_SECRET)
      .update(payloadString)
      .digest("hex");

    // ៣. បាញ់ Request ទៅកាន់ U-Pay API
    const response = await fetch(`${UPAY_URL}/api/v1/b2b/escrow/release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-upay-signature": signature,
      },
      body: payloadString,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // អាប់ដេតស្ថានភាពទៅជា កំពុងដំណើរការ រង់ចាំ Webhook
      withdrawal.status = "PROCESSING";
      withdrawal.upayTransactionId = data.transactionId;
      withdrawal.note = "កំពុងរង់ចាំ U-Pay ដំណើរការ និងបញ្ចេញ PDF";
      await withdrawal.save();

      res
        .status(200)
        .json({
          success: true,
          message: "បានបញ្ជាទៅ U-Pay ជោគជ័យ កំពុងរង់ចាំ Webhook!",
        });
    } else {
      res
        .status(400)
        .json({ success: false, message: "កំហុសពី U-Pay: " + data.message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "បញ្ហាបច្ចេកទេស Backend" });
  }
};
