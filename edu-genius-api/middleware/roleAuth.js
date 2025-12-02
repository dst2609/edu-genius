const jwt = require("jsonwebtoken");

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded._id;
      req.userRole = decoded.role || "student";

      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}` 
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = { requireRole };
