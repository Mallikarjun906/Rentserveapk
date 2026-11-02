const ApiError = require("../utils/ApiError");

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}

function requireApproval(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required."));
  }

  // Admins, customers, and owners do not require document verification approval
  if (["admin", "customer", "owner"].includes(req.user.role)) {
    return next();
  }

  if (req.user.approvalStatus !== "approved") {
    if (req.user.role === "provider") {
      return next(
        new ApiError(
          403,
          "Unapproved providers cannot publish services or accept bookings until reviewed and approved by an administrator."
        )
      );
    }
    return next(
      new ApiError(
        403,
        "Your account registration is pending administrator review and approval."
      )
    );
  }

  next();
}

module.exports = { allowRoles, requireApproval };
