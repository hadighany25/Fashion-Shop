const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ១. លេខសម្គាល់វិក័យប័ត្រ (ត្រូវតែមាន និងមិនអាចជាន់គ្នា)
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    // ២. ចំនួនទឹកប្រាក់សរុបដែលត្រូវបង់
    totalAmount: {
      type: Number,
      required: true,
    },

    // ៣. ស្ថានភាពនៃការបង់ប្រាក់ (ចាំបាច់បំផុតសម្រាប់ U-Pay)
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"], // អាចមានតែ ៣ ស្ថានភាពនេះទេ
      default: "PENDING", // ពេលបង្កើតភ្លាម គឺវានៅរង់ចាំ (PENDING) ជានិច្ច
    },

    // ៤. លេខប្រតិបត្តិការពីធនាគារ (ទុកកត់ត្រាពេល U-Pay បាញ់ Webhook មកប្រាប់ថាលុយចូល)
    upayTransactionId: {
      type: String,
      default: null,
    },

    // ៥. ពេលវេលាដែលលុយចូលពិតប្រាកដ
    paidAt: {
      type: Date,
      default: null,
    },

    // ៦. បញ្ជីទំនិញដែលភ្ញៀវទិញ (យើងដាក់ជា Array ធម្មតាសិនដើម្បីងាយស្រួល)
    items: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true, // វានឹងបង្កើត createdAt និង updatedAt ដោយស្វ័យប្រវត្តិ
  },
);

module.exports = mongoose.model("Order", orderSchema);
