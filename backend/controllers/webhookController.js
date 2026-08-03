const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");

const UPAY_SECRET = process.env.UPAY_SECRET || "UMALL_SECRET_456";

exports.upayWebhook = async (req, res) => {
  try {
    const incomingSignature = req.headers["x-upay-signature"];
    const payloadString = JSON.stringify(req.body);

    // ១. ផ្ទៀងផ្ទាត់ Signature ក្រែងលោ Hacker ក្លែងបន្លំធ្វើជា U-Pay
    const expectedSignature = crypto
      .createHmac("sha256", UPAY_SECRET)
      .update(payloadString)
      .digest("hex");

    if (incomingSignature !== expectedSignature) {
      return res
        .status(403)
        .json({ success: false, message: "ហាមឃាត់: Signature មិនត្រឹមត្រូវ!" });
    }

    const { orderId, status, transactionId, pdfUrl } = req.body;

    // ២. ស្វែងរកប្រវត្តិដកប្រាក់តាមរយៈ orderId (ដែលយើងបានផ្ញើទៅមុននេះ)
    const withdrawal = await Withdrawal.findById(orderId);

    if (withdrawal) {
      if (status === "SUCCESS") {
        withdrawal.status = "COMPLETED";
        withdrawal.pdfUrl = pdfUrl;
        withdrawal.note = "ប្រតិបត្តិការជោគជ័យ មានភ្ជាប់វិក្កយបត្រ PDF";
      } else if (status === "FAILED") {
        withdrawal.status = "REJECTED";
        withdrawal.note = req.body.reason || "ប្រតិបត្តិការបរាជ័យពីខាងធនាគារ";

        // ទីនេះគួរតែ បង្វិលលុយត្រឡប់ចូល Wallet របស់ Seller វិញ (Refund Balance)
      }
      await withdrawal.save();
    }

    // ៣. តបទៅ U-Pay វិញ ដើម្បីឱ្យ U-Pay ឈប់បាញ់ Webhook មកទៀត
    res.status(200).json({ success: true, message: "Webhook ទទួលបានជោគជ័យ!" });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
