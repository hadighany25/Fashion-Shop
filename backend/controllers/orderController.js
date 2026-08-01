const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    const { orderId, totalAmount, items } = req.body;

    // បង្កើតវិក័យប័ត្រថ្មី រួច Save ចូល MongoDB
    const newOrder = new Order({
      orderId,
      totalAmount,
      items,
      paymentStatus: "PENDING",
    });

    await newOrder.save();

    res.status(200).json({ success: true, message: "កត់ត្រាវិក័យប័ត្រជោគជ័យ" });
  } catch (error) {
    console.error("កំហុសក្នុងការបង្កើតវិក័យប័ត្រ:", error);
    res
      .status(500)
      .json({ success: false, message: "បញ្ហាក្នុងការ Save ចូល Database" });
  }
};

module.exports = { createOrder };
