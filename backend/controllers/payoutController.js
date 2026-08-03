const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");

// ប្តូរឈ្មោះអថេរឱ្យស៊ីគ្នា ១០០% ជាមួយនឹងឯកសារ .env របស់បង
const UPAY_API_KEY =
  process.env.UPAY_API_KEY || "upay_live_b4159a0f8a1e14d2b09d36b98992e98a";
const UPAY_SECRET =
  process.env.UPAY_API_SECRET ||
  "edb7169d82f2ba03eccc06e5d57e3576e2672979bfeea8834a963a60fa515786";
const UPAY_URL = process.env.UPAY_BASE_URL || "https://u-pay-bank.fly.dev";

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
// ២. Admin អនុម័ត និងបញ្ជាទៅ U-Pay
// ==========================================
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "សំណើនេះមិនត្រឹមត្រូវ ឬបានចាត់ចែងរួចហើយ!",
      });
    }

    // ១. រៀបចំ Data (មិនបាច់ដាក់ apiKey ក្នុង Body ទេ ព្រោះយើងនឹងដាក់វានៅក្នុង Header)
    const payload = {
      orderId: withdrawal._id.toString(),
      amount: withdrawal.amount,
      receiverAccount: withdrawal.accountNumber,
      description: `U-Mall Payout for Seller`,
    };

    const payloadString = JSON.stringify(payload);

    // ២. បង្កើត Timestamp និង HMAC Signature
    // 💡 ចំណុចសំខាន់៖ U-Pay API ទាមទារឱ្យយក Timestamp បូកជាមួយ Payload ទើបវាឱ្យឆ្លងកាត់
    const timestamp = Date.now().toString();
    const dataToSign = timestamp + payloadString;

    const signature = crypto
      .createHmac("sha256", UPAY_SECRET)
      .update(dataToSign)
      .digest("hex");

    // ៣. បាញ់ Request ទៅកាន់ U-Pay API ដោយភ្ជាប់ Headers ឱ្យបានត្រឹមត្រូវ
    const response = await fetch(`${UPAY_URL}/api/v1/b2b/escrow/release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": UPAY_API_KEY, // 👈 ប្រាប់ U-Pay ថាយើងជានរណា
        "x-timestamp": timestamp, // 👈 ប្រាប់ពេលវេលា
        "x-signature": signature, // 👈 ហត្ថលេខាសម្ងាត់
      },
      body: payloadString,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // អាប់ដេតស្ថានភាពទៅជា កំពុងដំណើរការ រង់ចាំ Webhook ទម្លាក់ PDF
      withdrawal.status = "PROCESSING";
      withdrawal.upayTransactionId = data.transactionId || "";
      withdrawal.note = "កំពុងរង់ចាំ U-Pay ដំណើរការ និងបញ្ចេញ PDF";
      await withdrawal.save();

      res.status(200).json({
        success: true,
        message: "បានបញ្ជាទៅ U-Pay ជោគជ័យ កំពុងរង់ចាំ Webhook!",
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
