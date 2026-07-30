const Setting = require("../models/Setting");

exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne().populate(
      "section1.items.storeId section2.items.storeId section3.items.storeId",
    );
    if (!setting) {
      setting = await Setting.create({
        logoUrl: "",
        section1: {},
        section2: {},
        section3: {},
      });
    }
    res.status(200).json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { logoUrl, section1, section2, section3 } = req.body;

    let setting = await Setting.findOne();
    if (!setting) setting = new Setting({});

    if (logoUrl !== undefined) setting.logoUrl = logoUrl;
    if (section1) setting.section1 = section1;
    if (section2) setting.section2 = section2;
    if (section3) setting.section3 = section3;

    await setting.save();
    res
      .status(200)
      .json({ success: true, message: "រក្សាទុកបានដោយជោគជ័យ!", setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
