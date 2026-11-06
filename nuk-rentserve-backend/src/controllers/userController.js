const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name email phone role location approvalStatus rejectionReason isOnline isActive isDemo createdAt"
  );
  res.json(new ApiResponse(200, user));
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "location", "isOnline"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (!Object.keys(updates).length) throw new ApiError(400, "Provide name, phone, location, or isOnline to update.");
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
    .select("name email phone role location approvalStatus rejectionReason isOnline isActive isDemo createdAt");
  if (updates.isOnline !== undefined) {
    const ProviderApplication = require("../models/ProviderApplication");
    await ProviderApplication.updateMany({ userId: req.user.id }, { $set: { isOnline: updates.isOnline } });
  }
  res.json(new ApiResponse(200, user, "Profile updated."));
});

module.exports = { getMe, updateMe };
