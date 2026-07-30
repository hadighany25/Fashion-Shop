const Setting = require("../models/Setting");

// ទាញយកការកំណត់ (Settings)
exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      // បើគ្មានទិន្នន័យក្នុង DB ទេ បង្កើតទម្រង់ស្ដង់ដារមួយទុកមុន
      setting = await Setting.create({
        logoUrl: "",
        heroBanners: [],
        subBanners: [],
      });
    }
    res.status(200).json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// កែប្រែការកំណត់ (សម្រាប់ Admin)
exports.updateSettings = async (req, res) => {
  try {
    const { logoUrl, heroBanners, subBanners } = req.body;

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting({});
    }

    if (logoUrl !== undefined) setting.logoUrl = logoUrl;
    if (heroBanners !== undefined) setting.heroBanners = heroBanners;
    if (subBanners !== undefined) setting.subBanners = subBanners;

    await setting.save();
    res
      .status(200)
      .json({ success: true, message: "កែប្រែដោយជោគជ័យ!", setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
