const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  let token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token && req.query && req.query.token) {
    token = String(req.query.token).trim();
  }
  if (!token) throw new ApiError(401, "Authentication token required.");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  const user = await User.findById(payload.sub).select(
    "name email phone role isActive approvalStatus rejectionReason location"
  );
  if (!user || !user.isActive) {
    throw new ApiError(401, "Account not found or inactive.");
  }

  if (user.approvalStatus === "suspended") {
    throw new ApiError(403, "Your account has been suspended by an administrator.");
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location,
    approvalStatus: user.approvalStatus,
    rejectionReason: user.rejectionReason,
    isActive: user.isActive
  };

  next();
});

module.exports = { authenticate };
