const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const ProviderApplication = require("../models/ProviderApplication");
const AuditLog = require("../models/AuditLog");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { uploadPublicImage } = require("../services/documentService");

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name email phone role location approvalStatus rejectionReason isOnline isActive isDemo profileImage createdAt"
  );
  if (!user) throw new ApiError(404, "User not found.");

  const userObj = user.toObject();

  // If user does not have a direct profile image, check provider or application profile image
  if (!userObj.profileImage?.url) {
    const sp = await ServiceProvider.findOne({ userId: req.user.id }).select("profileImage");
    if (sp?.profileImage?.url) {
      userObj.profileImage = sp.profileImage;
    } else {
      const app = await ProviderApplication.findOne({ userId: req.user.id }).select("profileImage");
      if (app?.profileImage?.url) {
        userObj.profileImage = app.profileImage;
      }
    }
  }

  res.json(new ApiResponse(200, userObj));
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "location", "isOnline"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Handle uploaded profile image file if present
  const profileFile = req.files?.profileImage?.[0] || req.file;
  if (profileFile) {
    const uploaded = await uploadPublicImage(profileFile);
    updates.profileImage = { url: uploaded.url, publicId: uploaded.publicId };
  } else if (req.body.profileImageUrl) {
    updates.profileImage = { url: String(req.body.profileImageUrl).trim(), publicId: "" };
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, "Provide name, phone, location, isOnline, or profileImage to update.");
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select(
    "name email phone role location approvalStatus rejectionReason isOnline isActive isDemo profileImage createdAt"
  );

  if (updates.profileImage) {
    await ServiceProvider.updateMany({ userId: req.user.id }, { $set: { profileImage: updates.profileImage } });
    await ProviderApplication.updateMany({ userId: req.user.id }, { $set: { profileImage: updates.profileImage } });
  }

  if (updates.isOnline !== undefined) {
    await ProviderApplication.updateMany({ userId: req.user.id }, { $set: { isOnline: updates.isOnline } });
  }

  res.json(new ApiResponse(200, user, "Profile updated."));
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
  const profileFile = req.files?.profileImage?.[0] || req.file;
  if (!profileFile) {
    throw new ApiError(400, "Please select an image file to upload.");
  }

  const uploaded = await uploadPublicImage(profileFile);
  const profileImage = { url: uploaded.url, publicId: uploaded.publicId };

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage },
    { new: true }
  ).select("name email phone role location approvalStatus rejectionReason isOnline isActive isDemo profileImage createdAt");

  await ServiceProvider.updateMany({ userId: req.user.id }, { $set: { profileImage } });
  await ProviderApplication.updateMany({ userId: req.user.id }, { $set: { profileImage } });

  res.json(new ApiResponse(200, { user, profileImage }, "Profile photo updated successfully."));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found.");

  // Anonymize personal data in compliance with DPDP Act 2023
  const anonymizedEmail = `deleted_${user._id}_${Date.now()}@anonymized.local`;
  user.name = "Deactivated User";
  user.email = anonymizedEmail;
  user.phone = "";
  user.phoneNumber = "";
  user.normalizedPhoneNumber = undefined;
  user.phoneVerified = false;
  user.password = undefined;
  user.profileImage = { url: "", publicId: "" };
  user.isActive = false;
  user.isOnline = false;
  user.refreshTokenHash = undefined;
  await user.save();

  // Deactivate linked applications and listings
  await ProviderApplication.updateMany(
    { userId: user._id },
    { $set: { status: "rejected", isOnline: false, rejectionReason: "Account deleted by user request." } }
  );

  await AuditLog.create({
    adminId: null,
    action: "ACCOUNT_DELETED_BY_USER",
    targetType: "User",
    targetId: user._id,
    details: { reason: req.body?.reason || "User requested self-deletion" },
    ipAddress: req.ip
  });

  res.json(new ApiResponse(200, null, "Your account and personal data have been successfully deleted."));
});

module.exports = { getMe, updateMe, updateProfilePhoto, deleteAccount };
