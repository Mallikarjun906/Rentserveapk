const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const ProviderApplication = require("../models/ProviderApplication");
const AuditLog = require("../models/AuditLog");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadPublicImage,
  uploadPrivateDocument,
  PRIVATE_DIR,
  maskIdentifier
} = require("../services/documentService");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const accessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const refreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

async function createAuthSession(user) {
  const newAccessToken = accessToken(user);
  const newRefreshToken = refreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      approvalStatus: user.approvalStatus,
      rejectionReason: user.rejectionReason || "",
      profileImage: user.profileImage || { url: "" }
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

// 1. Customer Registration
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword, address, location, city, terms } = req.body;
  const finalCity = String(location || city || "Bagalkot").trim();

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "Full name, email, mobile number, and password are required.");
  }

  if (confirmPassword && password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain between 8 and 72 characters.");
  }

  const hasAcceptedTerms = terms === true || terms === "true" || terms === "on" || req.body.termsAccepted === true || req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the Terms and Conditions.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "Email is already registered. Please log in instead.");
  }

  const files = req.files || {};
  const profileFile = files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];
  let uploadedProfile = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(String(name).trim())}&background=D71920&color=fff`,
    publicId: ""
  };
  if (profileFile) {
    uploadedProfile = await uploadPublicImage(profileFile);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    password: hashedPassword,
    role: "customer",
    approvalStatus: "approved",
    location: finalCity,
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId }
  });

  const session = await createAuthSession(user);
  res.status(201).json(new ApiResponse(201, session, "Customer registration successful."));
});

// 2. Driver Registration
const registerDriver = asyncHandler(async (req, res) => {
  const {
    fullName,
    name,
    email,
    phone,
    password,
    address,
    city,
    taluk,
    district,
    drivingLicenceNumber,
    vehicleType,
    vehicleRegistrationNumber,
    terms,
    consent
  } = req.body;

  const normalizedName = String(fullName || name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();
  const normalizedAddress = String(address || "").trim();
  const normalizedCity = String(city || "Bagalkot").trim();
  const normalizedTaluk = String(taluk || normalizedCity).trim();
  const normalizedDistrict = String(district || normalizedCity).trim();
  const dlNum = String(drivingLicenceNumber || "").trim().toUpperCase();
  const vType = String(vehicleType || "auto").trim().toLowerCase();
  const vReg = String(vehicleRegistrationNumber || "").trim().toUpperCase();

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !password || !dlNum || !vReg) {
    throw new ApiError(400, "Please provide all required driver registration fields.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain 8–72 characters.");
  }

  const hasAcceptedTerms = terms === true || terms === "true" || terms === "on" || req.body.termsAccepted === true || req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the Terms and Conditions.");
  }

  if (!(consent === true || consent === "true" || consent === "on")) {
    throw new ApiError(400, "Explicit consent is required for government identity and licence verification.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "This email is already registered. Please log in instead.");
  }

  const files = req.files || {};
  const profileFile = files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];
  const dlFile = files.drivingLicenceDocument?.[0] || files.aadhaarDocument?.[0] || files.document?.[0] || files.file?.[0];
  const addressProofFile = files.addressProofDocument?.[0];
  const rcFile = files.vehicleRcDocument?.[0];
  const vehicleFiles = files.vehicleImages || [];

  if (!dlFile) throw new ApiError(400, "Driving licence document upload is required.");

  let uploadedProfile = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=D71920&color=fff`,
    publicId: ""
  };
  if (profileFile) {
    uploadedProfile = await uploadPublicImage(profileFile);
  }

  // Upload vehicle images if any
  const uploadedVehicles = [];
  for (const vFile of vehicleFiles) {
    uploadedVehicles.push(await uploadPublicImage(vFile));
  }

  // Upload private documents
  const dlDoc = await uploadPrivateDocument(dlFile, "driving-licence");
  const addressDoc = addressProofFile ? await uploadPrivateDocument(addressProofFile, "address-proof") : null;
  const rcDoc = rcFile ? await uploadPrivateDocument(rcFile, "vehicle-rc") : null;

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    role: "driver",
    approvalStatus: "pending",
    location: normalizedCity,
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId }
  });

  const categoryName = vType === "car" ? "Passenger car" : vType === "goods-van" ? "Goods van" : "Auto";

  await ServiceProvider.create({
    userId: user._id,
    displayName: user.name,
    bio: `${categoryName} Driver (${vReg})`,
    verificationStatus: "pending",
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId },
    vehicleImages: uploadedVehicles.map((v) => ({ url: v.url, publicId: v.publicId }))
  });

  const appData = {
    userId: user._id,
    applicationType: "driver",
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    address: normalizedAddress,
    city: normalizedCity,
    taluk: normalizedTaluk,
    district: normalizedDistrict,
    category: categoryName,
    vehicleType: vType,
    vehicleRegistrationNumber: vReg,
    drivingLicenceNumber: dlNum,
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId },
    vehicleImages: uploadedVehicles.map((v) => ({ url: v.url, publicId: v.publicId })),
    drivingLicenceDocument: dlDoc,
    addressProofDocument: addressDoc || undefined,
    vehicleRcDocument: rcDoc || undefined,
    consent: true,
    status: "pending",
    documentVerificationStatus: "pending"
  };

  const application = await ProviderApplication.create(appData);

  await AuditLog.create({
    userId: user._id,
    action: "DRIVER_REGISTERED",
    targetUserId: user._id,
    targetUserEmail: user.email,
    targetRole: "driver",
    details: `Driver application submitted for vehicle: ${vType} (${vReg}). Status: Pending verification.`,
    ipAddress: req.ip || ""
  });

  const session = await createAuthSession(user);
  res.status(201).json(
    new ApiResponse(
      201,
      {
        ...session,
        applicationId: application.id,
        applicationStatus: "pending",
        message: "Driver application submitted. An administrator will review your documents before activating booking access."
      },
      "Driver registration submitted for administrator approval."
    )
  );
});

// 3. Student Registration
const registerStudent = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    collegeName,
    studentIdNumber,
    address,
    city,
    terms,
    consent
  } = req.body;

  const normalizedName = String(fullName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();
  const normalizedCollege = String(collegeName || "").trim();
  const normalizedIdNum = String(studentIdNumber || "").trim().toUpperCase();
  const normalizedAddress = String(address || "").trim();
  const normalizedCity = String(city || "Bagalkot").trim();

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !password || !normalizedCollege || !normalizedIdNum) {
    throw new ApiError(400, "Please provide full name, email, phone, college name, student ID number, and password.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain 8–72 characters.");
  }

  const hasAcceptedTerms = terms === true || terms === "true" || terms === "on" || req.body.termsAccepted === true || req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the Terms and Conditions.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "This email is already registered. Please log in instead.");
  }

  const files = req.files || {};
  const studentCardFile =
    files.studentIdCardDocument?.[0] ||
    files.studentIdCard?.[0] ||
    files.aadhaarDocument?.[0] ||
    files.document?.[0] ||
    files.file?.[0];
  const profileFile = files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];

  if (!studentCardFile) {
    throw new ApiError(400, "Student ID card document upload is required.");
  }

  let uploadedProfile = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=D71920&color=fff`,
    publicId: ""
  };
  if (profileFile) {
    uploadedProfile = await uploadPublicImage(profileFile);
  }

  const idCardDoc = await uploadPrivateDocument(studentCardFile, "student-id");

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    role: "student",
    approvalStatus: "pending",
    location: normalizedCity,
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId }
  });

  const application = await ProviderApplication.create({
    userId: user._id,
    applicationType: "student",
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    address: normalizedAddress,
    city: normalizedCity,
    taluk: normalizedCity,
    district: normalizedCity,
    category: "Student Rental Partner",
    collegeName: normalizedCollege,
    studentIdNumber: normalizedIdNum,
    studentIdCardDocument: idCardDoc,
    consent: Boolean(consent === true || consent === "true" || consent === "on"),
    status: "pending",
    documentVerificationStatus: "pending"
  });

  await AuditLog.create({
    userId: user._id,
    action: "STUDENT_REGISTERED",
    targetUserId: user._id,
    targetUserEmail: user.email,
    targetRole: "student",
    details: `Student registration submitted: ${normalizedCollege} (ID: ${normalizedIdNum}).`,
    ipAddress: req.ip || ""
  });

  const session = await createAuthSession(user);
  res.status(201).json(
    new ApiResponse(
      201,
      {
        ...session,
        applicationId: application.id,
        applicationStatus: "pending",
        message: "Student account registered. Verification is pending administrator review."
      },
      "Student registration submitted for review."
    )
  );
});

// 4. Property Owner Registration
const registerOwner = asyncHandler(async (req, res) => {
  const { name, fullName, email, phone, password, confirmPassword, address, location, city, terms } = req.body;
  const ownerName = String(name || fullName || "").trim();
  const finalCity = String(location || city || "Bagalkot").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();

  if (!ownerName || !normalizedEmail || !normalizedPhone || !password) {
    throw new ApiError(400, "Full name, email, mobile number, and password are required.");
  }

  if (confirmPassword && password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain between 8 and 72 characters.");
  }

  const hasAcceptedTerms =
    terms === true ||
    terms === "true" ||
    terms === "on" ||
    req.body.termsAccepted === true ||
    req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the Terms and Conditions.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "Email is already registered. Please log in instead.");
  }

  const files = req.files || {};
  const profileFile = files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];
  let uploadedProfile = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=D71920&color=fff`,
    publicId: ""
  };
  if (profileFile) {
    uploadedProfile = await uploadPublicImage(profileFile);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: ownerName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    role: "owner",
    approvalStatus: "approved",
    location: finalCity,
    profileImage: { url: uploadedProfile.url, publicId: uploadedProfile.publicId }
  });

  const session = await createAuthSession(user);
  res.status(201).json(new ApiResponse(201, session, "Property owner registration successful."));
});

// 4. Resubmit Documents
const resubmitDocuments = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findOne({ userId: req.user.id });
  if (!application) {
    throw new ApiError(404, "No application found for your account.");
  }

  const files = req.files || {};
  let updatedAny = false;

  if (files.aadhaarDocument?.[0] || files.govtIdDocument?.[0]) {
    const file = files.aadhaarDocument?.[0] || files.govtIdDocument?.[0];
    application.aadhaarDocument = await uploadPrivateDocument(file, "aadhaar");
    updatedAny = true;
  }

  if (files.drivingLicenceDocument?.[0]) {
    application.drivingLicenceDocument = await uploadPrivateDocument(files.drivingLicenceDocument[0], "driving-licence");
    updatedAny = true;
  }

  if (files.addressProofDocument?.[0]) {
    application.addressProofDocument = await uploadPrivateDocument(files.addressProofDocument[0], "address-proof");
    updatedAny = true;
  }

  if (files.vehicleRcDocument?.[0]) {
    application.vehicleRcDocument = await uploadPrivateDocument(files.vehicleRcDocument[0], "vehicle-rc");
    updatedAny = true;
  }

  if (files.studentIdCardDocument?.[0]) {
    application.studentIdCardDocument = await uploadPrivateDocument(files.studentIdCardDocument[0], "student-id");
    updatedAny = true;
  }

  if (!updatedAny && !files.document?.[0] && !files.file?.[0]) {
    throw new ApiError(400, "Please attach at least one document to resubmit.");
  }

  if (files.document?.[0] || files.file?.[0]) {
    const file = files.document?.[0] || files.file?.[0];
    if (application.applicationType === "student") {
      application.studentIdCardDocument = await uploadPrivateDocument(file, "student-id");
    } else if (application.applicationType === "driver") {
      application.drivingLicenceDocument = await uploadPrivateDocument(file, "driving-licence");
    } else {
      application.aadhaarDocument = await uploadPrivateDocument(file, "aadhaar");
    }
    updatedAny = true;
  }

  application.status = "pending";
  application.documentVerificationStatus = "pending";
  application.resubmittedAt = new Date();
  application.reviewNote = "Applicant resubmitted documents for review.";
  await application.save();

  await User.findByIdAndUpdate(req.user.id, {
    approvalStatus: "pending",
    rejectionReason: ""
  });

  await AuditLog.create({
    userId: req.user.id,
    action: "DOCUMENT_RESUBMITTED",
    targetUserId: req.user.id,
    targetRole: req.user.role,
    details: "User resubmitted replacement documents after rejection.",
    ipAddress: req.ip || ""
  });

  res.json(new ApiResponse(200, { status: "pending" }, "Documents resubmitted successfully. Your application is under review."));
});

// 5. Secure Private Document View
const viewPrivateDocument = asyncHandler(async (req, res) => {
  const { applicationId, docType } = req.params;
  const application = await ProviderApplication.findById(applicationId);
  if (!application) throw new ApiError(404, "Application record not found.");

  // Access Control: Admin or Document Owner only
  const isOwner = application.userId && application.userId.toString() === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Access denied. Only administrators and the document owner may access this document.");
  }

  const requestedType = docType || "aadhaarDocument";
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

  if (!doc || !doc.publicId) {
    throw new ApiError(404, "Requested document is not present in this application.");
  }

  // If stored in local private storage or demo document
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
    if (!fs.existsSync(filepath)) throw new ApiError(404, "Document file not found on disk.");
    const isPdf = filepath.endsWith(".pdf") || doc.mimeType === "application/pdf" || doc.resourceType === "raw";
    const mimeType = isPdf ? "application/pdf" : (doc.mimeType || "image/jpeg");
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filepath)}"`);
    return fs.createReadStream(filepath).pipe(res);
  }

  // If stored in Cloudinary authenticated asset
  const { cloudinary } = require("../config/cloudinary");
  const url = cloudinary.url(doc.publicId, {
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min signature
    resource_type: doc.resourceType || "image"
  });

  return res.redirect(url);
});

// 6. Get current authenticated user's own application
const getMyApplication = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findOne({ userId: req.user.id });
  if (!application) {
    return res.json(new ApiResponse(200, null, "No application record found for this user."));
  }

  const shaped = {
    id: application.id || application._id,
    _id: application._id,
    userId: application.userId,
    applicationType: application.applicationType,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    city: application.city,
    category: application.category,
    status: application.status,
    reviewNote: application.reviewNote,
    rejectionReason: application.rejectionReason,
    documentVerificationStatus: application.documentVerificationStatus,
    documentRejectionReason: application.documentRejectionReason,
    hasAadhaar: Boolean(application.aadhaarDocument?.publicId),
    hasDrivingLicence: Boolean(application.drivingLicenceDocument?.publicId),
    hasVehicleRc: Boolean(application.vehicleRcDocument?.publicId),
    hasStudentIdCard: Boolean(application.studentIdCardDocument?.publicId),
    hasAddressProof: Boolean(application.addressProofDocument?.publicId),
    drivingLicenceNumber: application.drivingLicenceNumber,
    vehicleRegistrationNumber: application.vehicleRegistrationNumber,
    vehicleType: application.vehicleType,
    collegeName: application.collegeName,
    studentIdNumber: application.studentIdNumber,
    profileImage: application.profileImage?.url,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt
  };

  return res.json(new ApiResponse(200, shaped));
});

// 7. View authenticated user's own document
const viewMyDocument = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findOne({ userId: req.user.id });
  if (!application) throw new ApiError(404, "No application found for current user.");
  req.params.applicationId = application._id.toString();
  return viewPrivateDocument(req, res);
});

module.exports = {
  registerCustomer,
  registerDriver,
  registerStudent,
  registerOwner,
  resubmitDocuments,
  viewPrivateDocument,
  getMyApplication,
  viewMyDocument
};
