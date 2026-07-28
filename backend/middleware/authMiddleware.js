const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ១. Middleware សម្រាប់ឆែកថា User បាន Login ហើយឬនៅ
const verifyToken = async (req, res, next) => {
  try {
    // ទាញយក Token ពី Header (ទម្រង់: Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "មិនមានសិទ្ធិទេ សូម Login ជាមុនសិន!",
        });
    }

    // ផ្ទៀងផ្ទាត់ Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key",
    );

    // ស្វែងរក User ក្នុង Database តាមរយៈ ID ដែលមានក្នុង Token ហើយកាត់ចោល Password
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "រកមិនឃើញគណនីនេះទេ!" });
    }

    next(); // អនុញ្ញាតឱ្យទៅកាន់ Route បន្តទៀត
  } catch (error) {
    res
      .status(401)
      .json({
        success: false,
        message: "Token មិនត្រឹមត្រូវ ឬផុតកំណត់ សូម Login ម្ដងទៀត!",
      });
  }
};

// ២. Middleware សម្រាប់ឆែកថា User នេះជាអ្នកលក់ (Seller) ឬ Admin
const isSellerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "seller" || req.user.role === "admin")) {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message:
          "សុំទោស! មានតែអ្នកលក់ (Seller) ឬ Admin ទេទើបអាចធ្វើសកម្មភាពនេះបាន។",
      });
  }
};

// ៣. Middleware សម្រាប់ឆែកថាមានតែ Admin ម្នាក់គត់ទើបមានសិទ្ធិ
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "សុំទោស! មានតែ Admin ទេទើបមានសិទ្ធិចូលទីនេះបាន។",
      });
  }
};

module.exports = { verifyToken, isSellerOrAdmin, isAdmin };
