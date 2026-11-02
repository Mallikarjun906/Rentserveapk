const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const ServiceListing = require("../models/ServiceListing");
const Property = require("../models/Property");
const ProviderApplication = require("../models/ProviderApplication");
const ServiceProvider = require("../models/ServiceProvider");
const ServiceCategory = require("../models/ServiceCategory");
const AuditLog = require("../models/AuditLog");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");
const { PRIVATE_DIR, maskIdentifier } = require("../services/documentService");

// 1. Dashboard Comprehensive Stats (All 12 sections overview)
const dashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalServices,
    totalProperties,
    pendingProviders,
    pendingDrivers,
    pendingStudents,
    approvedProviders,
    approvedDrivers,
    approvedStudents,
    rejectedApps,
    suspendedUsers
  ] = await Promise.all([
    User.countDocuments(),
    ServiceListing.countDocuments(),
    Property.countDocuments(),
    ProviderApplication.countDocuments({ applicationType: "provider", status: "pending" }),
    ProviderApplication.countDocuments({ applicationType: "driver", status: "pending" }),
    ProviderApplication.countDocuments({ applicationType: "student", status: "pending" }),
    ProviderApplication.countDocuments({ applicationType: "provider", status: "approved" }),
    ProviderApplication.countDocuments({ applicationType: "driver", status: "approved" }),
    ProviderApplication.countDocuments({ applicationType: "student", status: "approved" }),
    ProviderApplication.countDocuments({ status: "rejected" }),
    User.countDocuments({ approvalStatus: "suspended" })
  ]);

  res.json(
    new ApiResponse(200, {
      totalUsers,
      totalServices,
      totalProperties,
      pendingProviders,
      pendingDrivers,
      pendingStudents,
      approvedProviders,
      approvedDrivers,
      approvedStudents,
      rejectedApplications: rejectedApps,
      suspendedAccounts: suspendedUsers
    })
  );
});

// 2. List Applications by Type and Status
const listApplications = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  const filter = {};

  if (type && type !== "all") {
    filter.applicationType = type;
  }
  if (status && status !== "all") {
    filter.status = status;
  }

  const items = await ProviderApplication.find(filter)
    .populate("userId", "name email phone role approvalStatus location isActive")
    .sort({ createdAt: -1 })
    .limit(100);

  const shaped = items.map((app) => ({
    id: app.id,
    _id: app._id,
    userId: app.userId?._id || app.userId,
    user: app.userId,
    applicationType: app.applicationType || "provider",
    fullName: app.fullName,
    email: app.email,
    phone: app.phone,
    address: app.address,
    city: app.city,
    taluk: app.taluk,
    district: app.district,
    category: app.category,
    experience: app.experience,
    description: app.description,
    status: app.status,
    reviewNote: app.reviewNote || app.rejectionReason,
    rejectionReason: app.rejectionReason || app.reviewNote,
    documentVerificationStatus: app.documentVerificationStatus || "pending",
    resubmittedAt: app.resubmittedAt,

    // Specific Driver Fields
    drivingLicenceNumber: app.drivingLicenceNumber ? maskIdentifier(app.drivingLicenceNumber) : "",
    vehicleType: app.vehicleType,
    vehicleRegistrationNumber: app.vehicleRegistrationNumber,

    // Specific Student Fields
    collegeName: app.collegeName,
    studentIdNumber: app.studentIdNumber,

    // Document Availability Flags
    hasAadhaar: Boolean(app.aadhaarDocument?.publicId),
    hasDrivingLicence: Boolean(app.drivingLicenceDocument?.publicId),
    hasAddressProof: Boolean(app.addressProofDocument?.publicId),
    hasVehicleRc: Boolean(app.vehicleRcDocument?.publicId),
    hasStudentIdCard: Boolean(app.studentIdCardDocument?.publicId),
    profileImage: app.profileImage?.url,

    createdAt: app.createdAt,
    updatedAt: app.updatedAt
  }));

  res.json(new ApiResponse(200, shaped));
});

// Backward-compatible provider applications route
const listProviderApplications = asyncHandler(async (req, res) => {
  req.query.type = req.query.type || "provider";
  return listApplications(req, res);
});

// 3. Decide on Application (Approve / Reject / Info)
const decideApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rawDecision =
    req.body.decision ||
    (req.body.status === "approved" ? "approve" : req.body.status === "rejected" ? "reject" : req.body.status);
  const note = req.body.reason !== undefined ? req.body.reason : (req.body.note !== undefined ? req.body.note : (req.body.reviewNote || ""));

  if (!["approve", "info", "reject"].includes(rawDecision)) {
    throw new ApiError(400, "Decision must be approve, info, or reject.");
  }

  const application = await ProviderApplication.findById(id);
  if (!application) throw new ApiError(404, "Application record not found.");

  const isApproval = rawDecision === "approve";
  const isRejection = rawDecision === "reject";

  application.status = isApproval ? "approved" : isRejection ? "rejected" : "info";
  application.documentVerificationStatus = isApproval ? "approved" : isRejection ? "rejected" : "pending";
  application.reviewNote = String(note).slice(0, 500);
  application.rejectionReason = isRejection ? String(note).slice(0, 500) : "";
  await application.save();

  if (application.userId) {
    const userApprovalStatus = isApproval ? "approved" : isRejection ? "rejected" : "pending";
    await User.findByIdAndUpdate(application.userId, {
      approvalStatus: userApprovalStatus,
      rejectionReason: isRejection ? String(note).slice(0, 500) : ""
    });

    const verificationStatus = isApproval ? "verified" : isRejection ? "rejected" : "info";
    await ServiceProvider.findOneAndUpdate(
      { userId: application.userId },
      { verificationStatus, reviewNote: application.reviewNote }
    );

    // If approved provider, publish draft services
    if (isApproval && application.applicationType === "provider") {
      await Promise.all([
        ServiceListing.updateMany(
          { providerId: application.userId, status: "draft" },
          { $set: { status: "published" } }
        ),
        Property.updateMany(
          { ownerId: application.userId, status: "draft" },
          { $set: { status: "published" } }
        )
      ]);

      const category = await ServiceCategory.findOne({ name: application.category, isActive: true });
      if (category) {
        const title = `${application.category} services in ${application.city}`.slice(0, 120);
        const exists = await ServiceListing.findOne({ providerId: application.userId, categoryId: category._id });
        if (!exists) {
          const amounts = String(application.price || "").match(/\d+(?:\.\d+)?/g) || [];
          const min = amounts.length ? Number(amounts[0]) : 0;
          const max = amounts.length > 1 ? Math.max(min, Number(amounts[1])) : min;
          await ServiceListing.create({
            providerId: application.userId,
            categoryId: category._id,
            title,
            description: application.description || "Verified service provider",
            location: application.serviceArea || application.city,
            priceRange: { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 },
            images: application.profileImage?.url ? [{ url: application.profileImage.url, publicId: application.profileImage.publicId || "default" }] : [],
            status: "published"
          });
        }
      }
    }
  }

  await AuditLog.create({
    userId: req.user.id,
    adminName: req.user.name,
    adminEmail: req.user.email,
    action: isApproval ? "APPLICATION_APPROVED" : isRejection ? "APPLICATION_REJECTED" : "APPLICATION_INFO_REQUESTED",
    targetUserId: application.userId,
    targetUserEmail: application.email,
    targetRole: application.applicationType,
    details: `Application for ${application.fullName} (${application.applicationType}) set to ${application.status}.`,
    reason: note,
    ipAddress: req.ip || ""
  });

  res.json(
    new ApiResponse(
      200,
      {
        id: application.id,
        status: application.status,
        documentVerificationStatus: application.documentVerificationStatus,
        reviewNote: application.reviewNote,
        rejectionReason: application.rejectionReason
      },
      `Application successfully ${application.status}.`
    )
  );
});

// Backward compatible provider application decision
const decideProviderApplication = decideApplication;

// 4. Suspend or Unsuspend User
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason = "" } = req.body;

  if (id === req.user.id) {
    throw new ApiError(400, "Administrators cannot suspend their own account.");
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found.");

  const isSuspend = action === "suspend";
  user.approvalStatus = isSuspend ? "suspended" : "approved";
  user.suspendedReason = isSuspend ? String(reason).trim().slice(0, 500) : "";
  await user.save();

  await AuditLog.create({
    userId: req.user.id,
    adminName: req.user.name,
    adminEmail: req.user.email,
    action: isSuspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetUserId: user._id,
    targetUserEmail: user.email,
    targetRole: user.role,
    details: `Account for ${user.name} (${user.email}) was ${isSuspend ? "suspended" : "unsuspended"}.`,
    reason,
    ipAddress: req.ip || ""
  });

  res.json(new ApiResponse(200, user, `User account ${isSuspend ? "suspended" : "reactivated"}.`));
});

// 5. List Users with Filters
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const filter = {};

  if (req.query.role && req.query.role !== "all") filter.role = req.query.role;
  if (req.query.status && req.query.status !== "all") filter.approvalStatus = req.query.status;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email phone role location isActive approvalStatus rejectionReason suspendedReason createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json(new ApiResponse(200, { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

// 6. Set User Active Status (toggle isActive)
const setUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot deactivate your own account.");
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: Boolean(req.body.isActive) },
    { new: true, runValidators: true }
  ).select("name email role isActive approvalStatus");
  if (!user) throw new ApiError(404, "User not found.");

  await AuditLog.create({
    userId: req.user.id,
    adminName: req.user.name,
    adminEmail: req.user.email,
    action: req.body.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    targetUserId: user._id,
    targetRole: user.role,
    details: `User active state set to ${req.body.isActive}.`,
    ipAddress: req.ip || ""
  });

  res.json(new ApiResponse(200, user, "User status updated."));
});

// 7. Identity Review (name match / mismatch)
const reviewIdentity = asyncHandler(async (req, res) => {
  const { status, aadhaarName = "", note = "" } = req.body;
  if (!["match", "possible_mismatch", "manual_review_required"].includes(status)) {
    throw new ApiError(400, "Choose a valid identity review status.");
  }
  const application = await ProviderApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Provider application not found.");
  application.identityReviewStatus = status;
  application.aadhaarName = String(aadhaarName).trim().slice(0, 100);
  application.identityReviewNote = String(note).trim().slice(0, 500);
  application.identityReviewedBy = req.user.id;
  application.identityReviewedAt = new Date();
  await application.save();

  res.json(
    new ApiResponse(
      200,
      {
        id: application.id,
        identityReviewStatus: application.identityReviewStatus,
        identityReviewedAt: application.identityReviewedAt
      },
      "Identity review saved."
    )
  );
});

// 8. View Application Document (Supports local fallback and Cloudinary authenticated download)
const viewApplicationDocument = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application record not found.");

  const requestedType = req.params.docType || "aadhaarDocument";
  const normalizedKey = requestedType.endsWith("Document")
    ? requestedType
    : `${requestedType}Document`;

  const doc =
    application[requestedType] ||
    application[normalizedKey] ||
    (requestedType === "profileImage" ? application.profileImage : null) ||
    application.aadhaarDocument ||
    application.drivingLicenceDocument ||
    application.studentIdCardDocument ||
    application.addressProofDocument ||
    application.vehicleRcDocument;

  if (!doc || !doc.publicId) throw new ApiError(404, "No document was uploaded for this field.");

  // Check local fallback or demo document
  if (doc.publicId.startsWith("local-") || doc.publicId.startsWith("demo-")) {
    const filename = doc.publicId.replace("local-", "");
    let filepath = path.join(PRIVATE_DIR, filename);
    if (!fs.existsSync(filepath)) {
      const candidates = [
        `${filepath}.pdf`,
        `${filepath}.jpg`,
        `${filepath}.jpeg`,
        `${filepath}.png`,
        path.join(PRIVATE_DIR, `${filename}.pdf`),
        path.join(PRIVATE_DIR, `${filename}.jpg`),
        path.join(PRIVATE_DIR, "demo-dl-doc.pdf"),
        path.join(PRIVATE_DIR, "demo-aadhaar-doc.jpg")
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          filepath = cand;
          break;
        }
      }
    }

    if (!fs.existsSync(filepath)) throw new ApiError(404, "Document file not found on server.");
    const isPdf = filepath.endsWith(".pdf") || doc.mimeType === "application/pdf" || doc.resourceType === "raw";
    const mimeType = isPdf ? "application/pdf" : (doc.mimeType || "image/jpeg");
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="document-${requestedType}${isPdf ? ".pdf" : ".jpg"}"`);
    return fs.createReadStream(filepath).pipe(res);
  }

  // Cloudinary authenticated download
  if (!cloudinaryConfigured) throw new ApiError(503, "Private document storage is not configured.");
  const mimeType = doc.mimeType || (doc.resourceType === "raw" ? "application/pdf" : "image/jpeg");
  const ext = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";

  let signedUrl;
  try {
    if (cloudinary.utils && typeof cloudinary.utils.private_download_url === "function") {
      signedUrl = cloudinary.utils.private_download_url(doc.publicId, ext, {
        resource_type: doc.resourceType || "image",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60
      });
    } else {
      signedUrl = cloudinary.url(doc.publicId, {
        type: "authenticated",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 60,
        resource_type: doc.resourceType || "image"
      });
    }
  } catch (error) {
    console.error("Private document URL generation failed:", error.message);
    throw new ApiError(502, "Unable to securely retrieve this document.");
  }

  try {
    const upstream = await fetch(signedUrl, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (upstream && upstream.ok) {
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.set("Cache-Control", "no-store, private");
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Type", mimeType);
      res.set("Content-Disposition", `inline; filename="identity-document.${ext}"`);
      return res.status(200).send(bytes);
    }
  } catch (error) {
    // Upstream fetch direct streaming unavailable; fall back to signed redirect
  }

  return res.redirect(signedUrl);
});

// 9. Activity & Audit Logs
const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 40));

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate("userId", "name email role")
      .populate("targetUserId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments()
  ]);

  res.json(new ApiResponse(200, { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

module.exports = {
  dashboardStats,
  listApplications,
  listProviderApplications,
  decideApplication,
  decideProviderApplication,
  suspendUser,
  listUsers,
  setUserStatus,
  reviewIdentity,
  viewApplicationDocument,
  listAuditLogs
};
