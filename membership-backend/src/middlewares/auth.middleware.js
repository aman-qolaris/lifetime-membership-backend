import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access Denied. No token provided." });
    }

    // Verify the token cryptographically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Enforce role-based access (prevents non-admin JWTs from accessing admin routes)
    if (!decoded?.role || decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin access required.",
      });
    }

    // Attach the admin's ID to the request object for downstream use
    req.admin = decoded;

    // Pass control to the next middleware or controller
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired token." });
  }
};
