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

const listPublicProviders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const filter = {
    applicationType: "provider",
    status: "approved"
  };

  if (req.query.category && String(req.query.category).trim() && String(req.query.category).trim() !== "All") {
    filter.category = { $regex: String(req.query.category).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  if (req.query.city && String(req.query.city).trim()) {
    const cityTerm = String(req.query.city).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { city: { $regex: cityTerm, $options: "i" } },
      { district: { $regex: cityTerm, $options: "i" } },
      { address: { $regex: cityTerm, $options: "i" } }
    ];
  }

  const [applications, total] = await Promise.all([
    ProviderApplication.find(filter)
      .populate("userId", "name email phone location isOnline profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProviderApplication.countDocuments(filter)
  ]);

  const items = applications.map(app => ({
    id: app._id,
    _id: app._id,
    userId: app.userId?._id || app.userId,
    name: app.fullName || app.userId?.name || "Professional Provider",
    trade: app.category || "Service",
    category: app.category || "Service",
    area: app.city || app.address || app.userId?.location || "Bagalkot",
    rating: 4.8,
    reviews: 1,
    price: app.price || "₹350",
    rate: app.price || "₹350",
    rateUnit: "/visit",
    photo: app.profileImage?.url || app.userId?.profileImage?.url,
    phone: app.phone || app.userId?.phone,
    isAvailable: app.userId?.isOnline !== false,
    experience: app.experience || "2+ years"
  }));

  res.json(new ApiResponse(200, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

module.exports = { getMyProviderProfile, updateMyProviderProfile, listPublicProviders };
