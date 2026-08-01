const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    // ១. ចាប់យកទិន្នន័យដែល Frontend បោះមកឲ្យ
    const { orderId, totalAmount, items } = req.body;

    // ២. ឆែកមើលថាតើទិន្នន័យសំខាន់ៗមានគ្រប់គ្រាន់ដែរឬទេ?
    if (!orderId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "សូមបញ្ជាក់លេខ Order និងចំនួនទឹកប្រាក់ឲ្យបានច្បាស់លាស់!",
      });
    }

    // ៣. បង្កើត Order ថ្មី និង Save ចូល MongoDB (ស្ថានភាព PENDING នឹងត្រូវបានដាក់ដោយស្វ័យប្រវត្តិ)
    const newOrder = new Order({
      orderId: orderId,
      totalAmount: totalAmount,
      items: items || [], // បើមានអីវ៉ាន់ក៏ Save ទុក បើអត់ទេដាក់ Array ទទេ
    });

    await newOrder.save();

    // ៤. ឆ្លើយតបទៅ Frontend វិញថា Save ជោគជ័យ
    res.status(201).json({
      success: true,
      message: "បានបង្កើតវិក័យប័ត្រជោគជ័យ និងកំពុងរង់ចាំការទូទាត់ (PENDING)",
      orderId: newOrder.orderId,
    });
  } catch (error) {
    // ករណី Error ដូចជាលេខ orderId ជាន់គ្នាជាដើម
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យចូល Database",
    });
  }
};

module.exports = { createOrder };
