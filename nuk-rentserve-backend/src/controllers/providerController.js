const mongoose = require("mongoose");
const ServiceProvider = require("../models/ServiceProvider");
const ProviderApplication = require("../models/ProviderApplication");
const ServiceListing = require("../models/ServiceListing");
const User = require("../models/User");
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

const getPublicProviderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid provider ID.");
  }

  // 1. Try ProviderApplication
  let app = await ProviderApplication.findById(id).populate("userId", "name email phone location isOnline profileImage").lean();
  let user = null;
  let profile = null;

  if (app) {
    user = app.userId;
    profile = await ServiceProvider.findOne({ userId: user?._id || user }).lean();
  } else {
    // 2. Try User directly
    user = await User.findById(id).select("name email phone location isOnline profileImage role approvalStatus").lean();
    if (user) {
      app = await ProviderApplication.findOne({ userId: user._id, applicationType: "provider" }).lean();
      profile = await ServiceProvider.findOne({ userId: user._id }).lean();
    } else {
      // 3. Try ServiceProvider
      profile = await ServiceProvider.findById(id).populate("userId", "name email phone location isOnline profileImage").lean();
      if (profile) {
        user = profile.userId;
        app = await ProviderApplication.findOne({ userId: user?._id || user, applicationType: "provider" }).lean();
      }
    }
  }

  if (!user && !app) {
    throw new ApiError(404, "Provider not found.");
  }

  const userId = user?._id || user || app?.userId;
  const services = await ServiceListing.find({ providerId: userId, status: "published" }).lean();

  const formatted = {
    id: app?._id || id,
    _id: app?._id || id,
    userId: userId,
    providerId: {
      _id: userId,
      name: app?.fullName || user?.name || "Professional Provider",
      phone: app?.phone || user?.phone || "",
      profileImage: app?.profileImage || user?.profileImage || undefined,
    },
    name: app?.fullName || user?.name || "Professional Provider",
    fullName: app?.fullName || user?.name || "Professional Provider",
    trade: app?.category || "Professional Service",
    category: app?.category || "Professional Service",
    bio: profile?.bio || app?.description || "Local verified professional",
    description: profile?.bio || app?.description || "Local verified professional",
    area: app?.city || app?.address || user?.location || "Bagalkot",
    location: app?.city || app?.address || user?.location || "Bagalkot",
    rating: profile?.rating || 4.8,
    reviews: profile?.reviewCount || 1,
    rate: app?.price || (profile?.visitingFee ? `₹${profile.visitingFee}` : "₹350"),
    priceRange: { min: 350, max: 1200 },
    payUnit: "visit",
    rateUnit: "/visit",
    photo: app?.profileImage?.url || user?.profileImage?.url,
    phone: app?.phone || user?.phone,
    isAvailable: user?.isOnline !== false,
    availability: user?.isOnline !== false,
    experience: app?.experience || (profile?.experienceYears ? `${profile.experienceYears} years` : "2+ years"),
    services: services || [],
  };

  res.json(new ApiResponse(200, formatted));
});

module.exports = { getMyProviderProfile, updateMyProviderProfile, listPublicProviders, getPublicProviderById };
