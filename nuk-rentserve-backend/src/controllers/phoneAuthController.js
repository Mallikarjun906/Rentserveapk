const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const ProviderApplication = require("../models/ProviderApplication");
const PasswordResetToken = require("../models/PasswordResetToken");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { buildPhoneQuery, normalizePhoneNumber } = require("../utils/phoneUtils");
const {
  processPhoneVerification,
  consumeVerificationSession,
  hashToken
} = require("../services/phoneEmailService");
const {
  uploadPublicImage,
  uploadPrivateDocument
} = require("../services/documentService");

const createAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

function sessionUser(user) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || user.phoneNumber || "",
    phoneCountryCode: user.phoneCountryCode || "+91",
    phoneNumber: user.phoneNumber || user.phone || "",
    normalizedPhoneNumber: user.normalizedPhoneNumber || "",
    phoneVerified: Boolean(user.phoneVerified),
    phoneVerifiedAt: user.phoneVerifiedAt || null,
    profileCompleted: Boolean(user.profileCompleted),
    role: user.role,
    location: user.location,
    approvalStatus: user.approvalStatus,
    registrationStatus: user.registrationStatus || user.approvalStatus,
    rejectionReason: user.rejectionReason || "",
    profileImage: user.profileImage || { url: "" }
  };
}

async function createAuthSession(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return {
    user: sessionUser(user),
    accessToken,
    refreshToken
  };
}

/**
 * 1. Global Phone.Email verification endpoint
 * POST /api/auth/phone-email/verify or /api/v1/auth/phone-email/verify
 */
const verifyPhoneEmail = asyncHandler(async (req, res) => {
  const { user_json_url, purpose } = req.body;

  if (!user_json_url) {
    throw new ApiError(400, "user_json_url is required.");
  }
  if (!purpose) {
    throw new ApiError(400, "purpose is required.");
  }

  const result = await processPhoneVerification({
    user_json_url,
    purpose,
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || ""
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        verificationToken: result.verificationToken,
        phoneCountryCode: result.phoneCountryCode,
        phoneNumber: result.phoneNumber,
        normalizedPhoneNumber: result.normalizedPhoneNumber,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        expiresAt: result.expiresAt
      },
      "Phone verified successfully."
    )
  );
});

/**
 * 2. Customer Registration with Phone.Email OTP
 * POST /api/auth/customer/register or /api/v1/auth/customer/register
 */
const registerCustomerWithOtp = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    verificationToken,
    address,
    city,
    location,
    terms
  } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Full name, email, and password are required.");
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

  // Validate and consume phone verification token
  const verifiedSession = await consumeVerificationSession({
    verificationToken,
    expectedPurpose: "customer-registration"
  });

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "Email is already registered. Please log in instead.");
  }

  // Check if verified phone already exists for another customer
  const existingPhoneUser = await User.findOne(
    buildPhoneQuery(verifiedSession.phoneNumber)
  );
  if (existingPhoneUser) {
    throw new ApiError(
      409,
      "This phone number is already registered. Please log in using Mobile OTP."
    );
  }

  const finalCity = String(city || location || address || "Bagalkot").trim();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: verifiedSession.phoneNumber,
    phoneCountryCode: verifiedSession.phoneCountryCode,
    phoneNumber: verifiedSession.phoneNumber,
    normalizedPhoneNumber: verifiedSession.normalizedPhoneNumber,
    phoneVerified: true,
    phoneVerifiedAt: new Date(),
    profileCompleted: true,
    password: hashedPassword,
    role: "customer",
    approvalStatus: "approved",
    registrationStatus: "approved",
    location: finalCity,
    profileImage: {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        String(name).trim()
      )}&background=D71920&color=fff`,
      publicId: ""
    }
  });

  const session = await createAuthSession(user);
  return res.status(201).json(
    new ApiResponse(201, session, "Customer registration successful.")
  );
});

/**
 * 3. Customer Login with Mobile OTP (Passwordless)
 * POST /api/auth/customer/phone-login or /api/v1/auth/customer/phone-login
 */
const customerPhoneLogin = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  if (!verificationToken) {
    throw new ApiError(400, "Phone verification token is required.");
  }

  // Validate and atomically consume the verification session
  const verifiedSession = await consumeVerificationSession({
    verificationToken,
    expectedPurpose: "customer-login"
  });

  const { phoneCountryCode, phoneNumber, normalizedPhoneNumber } =
    verifiedSession;

  // Search existing user
  let user = await User.findOne(buildPhoneQuery(phoneNumber)).select(
    "+password +refreshTokenHash"
  );

  let isNewUser = false;

  if (user) {
    // Strictly forbid non-customer roles from authenticating via customer OTP login
    if (user.role !== "customer") {
      throw new ApiError(
        403,
        `This mobile number belongs to a ${user.role} account. Please use the designated ${user.role} portal.`
      );
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account is inactive. Please contact support.");
    }

    // Update phone verification status if not marked yet
    if (!user.phoneVerified) {
      user.phoneVerified = true;
      user.phoneVerifiedAt = new Date();
      user.phoneCountryCode = phoneCountryCode;
      user.phoneNumber = phoneNumber;
      user.normalizedPhoneNumber = normalizedPhoneNumber;
      await user.save();
    }
  } else {
    // New customer registration via OTP
    isNewUser = true;
    const defaultName = `Customer ${phoneNumber.slice(-4)}`;
    const placeholderEmail = `phone_${phoneNumber}@nukrentserve.local`;

    user = await User.create({
      name: defaultName,
      email: placeholderEmail,
      phone: phoneNumber,
      phoneCountryCode,
      phoneNumber,
      normalizedPhoneNumber,
      role: "customer",
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profileCompleted: false, // Customer can complete profile after login
      approvalStatus: "approved",
      registrationStatus: "approved",
      location: "Bagalkot",
      profileImage: {
        url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          defaultName
        )}&background=D71920&color=fff`,
        publicId: ""
      }
    });
  }

  const session = await createAuthSession(user);
  session.isNewUser = isNewUser;

  return res.status(200).json(
    new ApiResponse(
      200,
      session,
      isNewUser
        ? "New customer account created and authenticated."
        : "Customer authenticated successfully via Mobile OTP."
    )
  );
});

/**
 * 4. Provider Registration with OTP
 * POST /api/auth/provider/register or /api/v1/auth/provider/register
 */
const registerProviderWithOtp = asyncHandler(async (req, res) => {
  const {
    fullName,
    name,
    dob,
    email,
    password,
    address,
    serviceArea,
    area,
    city,
    taluk,
    district,
    category,
    experience,
    price,
    description,
    consent,
    terms,
    verificationToken
  } = req.body;

  if (!verificationToken) {
    throw new ApiError(
      400,
      "Mobile OTP verification is required to complete provider registration."
    );
  }

  // Validate and consume verification session for provider registration
  const verifiedSession = await consumeVerificationSession({
    verificationToken,
    expectedPurpose: "provider-registration"
  });

  const normalizedName = typeof (fullName || name) === "string" ? (fullName || name).trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedCity = typeof city === "string" && city.trim() ? city.trim() : "Bagalkot";
  const normalizedAddress =
    typeof address === "string" && address.trim().length >= 3
      ? address.trim()
      : `${normalizedCity}, Karnataka`;
  const normalizedCategory =
    typeof category === "string" && category.trim()
      ? category.trim()
      : "Other Services";
  const normalizedExperience =
    typeof experience === "string" && experience.trim()
      ? experience.trim()
      : "2 years";
  const normalizedArea = String(
    serviceArea || area || address || normalizedCity
  ).trim();
  const normalizedTaluk =
    typeof taluk === "string" && taluk.trim() ? taluk.trim() : normalizedCity;
  const normalizedDistrict =
    typeof district === "string" && district.trim()
      ? district.trim()
      : normalizedCity;
  const normalizedDescription =
    typeof description === "string" && description.trim().length >= 5
      ? description.trim()
      : `${normalizedCategory} services across ${normalizedCity}.`;

  if (!normalizedName || !normalizedEmail || !password) {
    throw new ApiError(
      400,
      "Full name, email, and password are required for provider registration."
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain between 8 and 72 characters.");
  }

  const hasAcceptedTerms =
    terms === true ||
    terms === "on" ||
    terms === "true" ||
    req.body.termsAccepted === true ||
    req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the terms of service.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(
      409,
      "This email is already registered. Please log in instead."
    );
  }

  // Handle uploaded files
  const files = req.files || {};
  const profileFile =
    files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];
  const vehicleFiles = files.vehicleImages || [];
  const aadhaarFile =
    files.aadhaarDocument?.[0] ||
    files.govtIdDocument?.[0] ||
    files.document?.[0] ||
    files.file?.[0];
  const addressFile = files.addressProofDocument?.[0];

  let uploadedProfileImage = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      normalizedName
    )}&background=D71920&color=fff`,
    publicId: ""
  };
  if (profileFile) {
    uploadedProfileImage = await uploadPublicImage(profileFile);
  }

  let uploadedVehicleImages = [];
  for (const file of vehicleFiles) {
    uploadedVehicleImages.push(await uploadPublicImage(file));
  }

  let uploadedDocument = null;
  if (aadhaarFile) {
    uploadedDocument = await uploadPrivateDocument(aadhaarFile, "aadhaar");
  }

  let uploadedAddressProof = null;
  if (addressFile) {
    uploadedAddressProof = await uploadPrivateDocument(addressFile, "address");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: verifiedSession.phoneNumber,
    phoneCountryCode: verifiedSession.phoneCountryCode,
    phoneNumber: verifiedSession.phoneNumber,
    normalizedPhoneNumber: verifiedSession.normalizedPhoneNumber,
    phoneVerified: true,
    phoneVerifiedAt: new Date(),
    password: hashedPassword,
    role: "provider",
    approvalStatus: "pending",
    registrationStatus: "pending",
    location: normalizedCity,
    profileImage: {
      url: uploadedProfileImage.url || "",
      publicId: uploadedProfileImage.publicId || ""
    }
  });

  await ServiceProvider.create({
    userId: user._id,
    displayName: user.name,
    bio: normalizedDescription,
    verificationStatus: "pending",
    profileImage: {
      url: uploadedProfileImage.url || "",
      publicId: uploadedProfileImage.publicId || ""
    },
    vehicleImages: uploadedVehicleImages.map((img) => ({
      url: img.url,
      publicId: img.publicId
    }))
  });

  const applicationData = {
    userId: user._id,
    fullName: user.name,
    phone: user.phone,
    dob: dob ? new Date(dob) : new Date("1995-01-01"),
    email: user.email,
    address: normalizedAddress,
    serviceArea: normalizedArea,
    city: normalizedCity,
    taluk: normalizedTaluk,
    district: normalizedDistrict,
    profileImage: {
      url: uploadedProfileImage.url || "",
      publicId: uploadedProfileImage.publicId || ""
    },
    vehicleImages: uploadedVehicleImages.map((img) => ({
      url: img.url,
      publicId: img.publicId
    })),
    category: normalizedCategory,
    experience: normalizedExperience,
    price: String(price || "").trim(),
    description: normalizedDescription,
    consent: Boolean(consent === true || consent === "on" || consent === "true"),
    status: "pending"
  };

  if (uploadedDocument) applicationData.aadhaarDocument = uploadedDocument;
  if (uploadedAddressProof) applicationData.addressProofDocument = uploadedAddressProof;

  const application = await ProviderApplication.create(applicationData);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: sessionUser(user),
        application: {
          id: application.id,
          status: application.status
        }
      },
      "Provider registration submitted. Your application is under review by the administrator."
    )
  );
});

/**
 * 5. Provider Login with Mandatory Approval Check
 * POST /api/auth/provider/login or /api/v1/auth/provider/login
 */
const providerLogin = asyncHandler(async (req, res) => {
  const { email, identifier, login: bodyLogin, password } = req.body;
  const loginId = String(identifier || email || bodyLogin || "").trim();

  if (!loginId || !password) {
    throw new ApiError(400, "Provider email/mobile and password are required.");
  }

  const user = await User.findOne({
    $or: [
      { email: loginId.toLowerCase() },
      { phone: loginId },
      { phoneNumber: loginId },
      { normalizedPhoneNumber: loginId }
    ]
  }).select("+password +refreshTokenHash");

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid provider credentials.");
  }

  if (user.role !== "provider" && user.role !== "admin") {
    throw new ApiError(
      403,
      `This account is registered as ${user.role}. Please use the ${user.role} login portal.`
    );
  }

  if (!user.isActive) {
    throw new ApiError(403, "Provider account is deactivated.");
  }

  // Strict approval status check for providers
  if (user.role === "provider") {
    if (user.approvalStatus === "pending") {
      throw new ApiError(
        403,
        "Your registration is under review. Please wait for admin approval."
      );
    }

    if (user.approvalStatus === "rejected") {
      const reason = user.rejectionReason
        ? ` Reason: ${user.rejectionReason}`
        : "";
      throw new ApiError(
        403,
        `Your provider registration was rejected by administrator.${reason} You may resubmit documents.`
      );
    }

    if (user.approvalStatus === "suspended") {
      throw new ApiError(
        403,
        "Your provider account has been suspended. Please contact support."
      );
    }

    if (user.approvalStatus !== "approved") {
      throw new ApiError(
        403,
        "Your registration is under review. Please wait for admin approval."
      );
    }
  }

  const session = await createAuthSession(user);
  return res.status(200).json(
    new ApiResponse(200, session, "Provider logged in successfully.")
  );
});

/**
 * 6. Forgot Password via Phone.Email OTP Verification
 * POST /api/auth/password/forgot or /api/v1/auth/password/forgot
 */
const forgotPasswordWithOtp = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  if (!verificationToken) {
    throw new ApiError(
      400,
      "Phone verification token is required for password reset."
    );
  }

  // Validate and consume verification session for password reset
  const verifiedSession = await consumeVerificationSession({
    verificationToken,
    expectedPurpose: "password-reset"
  });

  const { phoneNumber } = verifiedSession;

  // Match verified phone to an account
  const user = await User.findOne({
    ...buildPhoneQuery(phoneNumber),
    isActive: true
  });

  const genericSuccess =
    "If an eligible account is registered with this verified phone number, you may proceed to reset your password.";

  if (!user) {
    // Prevent account enumeration
    return res.status(200).json(
      new ApiResponse(200, { resetToken: null }, genericSuccess)
    );
  }

  // Invalidate any existing reset tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });

  // Issue short-lived, single-use reset authorization token (15 mins)
  const rawResetToken = crypto.randomBytes(32).toString("hex");

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(rawResetToken),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resetToken: rawResetToken,
        userId: user._id,
        userRole: user.role
      },
      "Phone verified successfully. Please enter your new password."
    )
  );
});

/**
 * 7. Reset Password with Single-Use Authorization Token
 * POST /api/auth/password/reset or /api/v1/auth/password/reset
 */
const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { resetToken, token, newPassword, confirmPassword, password } = req.body;
  const authToken = String(resetToken || token || "").trim();
  const finalPassword = newPassword || password;

  if (!authToken) {
    throw new ApiError(400, "Reset authorization token is required.");
  }

  if (confirmPassword && finalPassword !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match.");
  }

  if (
    typeof finalPassword !== "string" ||
    finalPassword.length < 8 ||
    finalPassword.length > 72
  ) {
    throw new ApiError(400, "Password must contain between 8 and 72 characters.");
  }

  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(authToken),
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    throw new ApiError(400, "Invalid or expired password reset authorization.");
  }

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) {
    throw new ApiError(400, "User account not found or inactive.");
  }

  // Update password with secure bcrypt cost factor 12
  user.password = await bcrypt.hash(finalPassword, 12);

  // Revoke all existing sessions and refresh tokens
  user.set("refreshTokenHash", undefined);
  await user.save();

  // Atomically delete all reset tokens for this user to enforce single-use
  await PasswordResetToken.deleteMany({ userId: user._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Password reset successfully. Please log in with your new password."
    )
  );
});

/**
 * 8. Customer Profile Completion / Update
 * PUT /api/customer/profile or PUT /api/v1/customer/profile
 */
const updateCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const { name, email, address, city, location } = req.body;
  const updates = {};

  if (name && typeof name === "string" && name.trim().length >= 2) {
    updates.name = name.trim();
  }

  if (email && typeof email === "string" && email.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new ApiError(400, "Please provide a valid email address.");
    }
    // Check if new email conflicts with another user
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id }
    });
    if (existing) {
      throw new ApiError(409, "Email is already in use by another account.");
    }
    updates.email = normalizedEmail;
  }

  const finalCity = String(city || location || address || "").trim();
  if (finalCity) {
    updates.location = finalCity;
  }

  // Handle uploaded profile image file if present
  const profileFile = req.files?.profileImage?.[0] || req.file;
  if (profileFile) {
    const uploaded = await uploadPublicImage(profileFile);
    updates.profileImage = { url: uploaded.url, publicId: uploaded.publicId };
  }

  // Mark profileCompleted as true once customer updates their details
  updates.profileCompleted = true;

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  });

  return res.status(200).json(
    new ApiResponse(200, sessionUser(updatedUser), "Customer profile updated successfully.")
  );
});

module.exports = {
  verifyPhoneEmail,
  registerCustomerWithOtp,
  customerPhoneLogin,
  registerProviderWithOtp,
  providerLogin,
  forgotPasswordWithOtp,
  resetPasswordWithOtp,
  updateCustomerProfile
};
