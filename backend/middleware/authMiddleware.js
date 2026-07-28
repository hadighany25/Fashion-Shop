const jwt = require("jsonwebtoken");

// ១. សន្តិសុខទូទៅ: ឆែកមើលថាតើមានសំបុត្រ (Token) ត្រឹមត្រូវឬអត់? (សម្រាប់គ្រប់គ្នាដែល Login)
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ឆែកមើលបើអត់មាន Token ភ្ជាប់មកទេ
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          success: false,
          message: "សូម Login ជាមុនសិន (No token provided)!",
        });
    }

    const token = authHeader.split(" ")[1];

    // បកប្រែ Token មកវិញ ដោយប្រៀបធៀបជាមួយសោសម្ងាត់ (JWT_SECRET)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "FASHION_SHOP_SECRET_KEY",
    );

    // បញ្ចូលទិន្នន័យ (id, role, username) ទៅក្នុង req.user ដើម្បីឲ្យ Controller ងាយស្រួលយកទៅប្រើបន្ត
    req.user = decoded;
    next(); // អនុញ្ញាតឲ្យដើរទៅមុខបន្ត
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Token មិនត្រឹមត្រូវ ឬហួសកំណត់ (Invalid Token)!",
      });
  }
};

// ២. សន្តិសុខសម្រាប់ Super Admin ប៉ុណ្ណោះ
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super_admin") {
    next(); // ឱ្យឆ្លងកាត់
  } else {
    return res
      .status(403)
      .json({
        success: false,
        message: "សិទ្ធិត្រូវបដិសេធ! សម្រាប់តែ Super Admin ប៉ុណ្ណោះ។",
      });
  }
};

// ៣. សន្តិសុខសម្រាប់ Admin (Super Admin ក៏អាចចូលបានដែរ)
const isAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "super_admin")
  ) {
    next();
  } else {
    return res
      .status(403)
      .json({
        success: false,
        message: "សិទ្ធិត្រូវបដិសេធ! សម្រាប់តែ Admin ប៉ុណ្ណោះ។",
      });
  }
};

// ៤. សន្តិសុខសម្រាប់អ្នកលក់ (Seller)
const isSeller = (req, res, next) => {
  if (req.user && req.user.role === "seller") {
    next();
  } else {
    return res
      .status(403)
      .json({
        success: false,
        message: "សិទ្ធិត្រូវបដិសេធ! សម្រាប់តែអ្នកលក់ (Seller) ប៉ុណ្ណោះ។",
      });
  }
};

// ៥. (ស្រេចចិត្ត) សន្តិសុខសម្រាប់បុគ្គលិកទាំងអស់ (Super Admin, Admin, Seller)
const isStaff = (req, res, next) => {
  if (req.user && ["super_admin", "admin", "seller"].includes(req.user.role)) {
    next();
  } else {
    return res
      .status(403)
      .json({
        success: false,
        message: "សិទ្ធិត្រូវបដិសេធ! សម្រាប់តែបុគ្គលិកប៉ុណ្ណោះ។",
      });
  }
};

module.exports = {
  verifyToken,
  isSuperAdmin,
  isAdmin,
  isSeller,
  isStaff,
};
