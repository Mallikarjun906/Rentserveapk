const ServiceProvider = require("../models/ServiceProvider");
const ProviderApplication = require("../models/ProviderApplication");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getMyProviderProfile = asyncHandler(async (req, res) => {
  const profile = await ServiceProvider.findOne({ userId: req.user.id }).populate("userId", "name email location phone");
  const application = await ProviderApplication.findOne({ userId: req.user.id, applicationType: "provider" });
  if (!profile && !application) throw new ApiError(404, "Provider profile not found.");

  const responseData = {
    ...(profile ? profile.toObject() : {}),
    displayName: profile?.displayName || application?.fullName || req.user.name,
    verificationStatus: application?.status || profile?.verificationStatus || req.user.approvalStatus || "pending",
    reviewNote: application?.reviewNote || profile?.reviewNote || req.user.rejectionReason || "",
    category: application?.category || "General Service",
    experienceYears: profile?.experienceYears || (application?.experience ? parseInt(application.experience, 10) || 0 : 0),
    bio: profile?.bio || application?.description || "",
    address: application?.address || "",
    serviceArea: application?.serviceArea || "",
    locationCoordinates: application?.locationCoordinates || null,
    hasAadhaar: Boolean(application?.aadhaarDocument?.publicId),
    hasAddressProof: Boolean(application?.addressProofDocument?.publicId),
  };
  res.json(new ApiResponse(200, responseData));
});

const updateMyProviderProfile = asyncHandler(async (req, res) => {
  const allowed = ["displayName", "bio", "skills", "experienceYears"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const profile = await ServiceProvider.findOneAndUpdate(
    { userId: req.user.id }, { $set: updates }, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(new ApiResponse(200, profile, "Provider profile updated."));
});

module.exports = { getMyProviderProfile, updateMyProviderProfile };
