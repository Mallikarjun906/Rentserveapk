const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const PhoneOtp = require("../models/PhoneOtp");
const PhoneVerificationSession = require("../models/PhoneVerificationSession");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { normalizePhoneNumber, buildPhoneQuery } = require("../utils/phoneUtils");
const { sendSmsOtp } = require("../services/smsService");
const { consumeVerificationSession } = require("../services/phoneEmailService");

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp).trim()).digest("hex");

const createAccessToken = (user) =>
  jwt.sign(
    { sub: user.id || user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id || user._id, type: "refresh" },
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
 * 1. Send OTP to Mobile Number
 * POST /api/auth/phone/send-otp or /api/auth/send-otp
 */
const sendOtp = asyncHandler(async (req, res) => {
  const rawPhone = String(req.body.phone || req.body.phoneNumber || req.body.mobile || "").trim();
  const rawPurpose = String(req.body.purpose || "registration").trim();
  const role = String(req.body.role || "customer").trim();

  if (!rawPhone) {
    throw new ApiError(400, "Mobile number is required.");
  }

  const { phoneCountryCode, phoneNumber, normalizedPhoneNumber } =
    normalizePhoneNumber("+91", rawPhone);

  // Validate Indian mobile number: 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
    throw new ApiError(
      400,
      "Please enter a valid 10-digit Indian mobile number."
    );
  }

  // 1. If purpose is registration, prevent duplicate account
  const isReg =
    rawPurpose === "registration" ||
    rawPurpose === "customer-registration" ||
    rawPurpose === "provider-registration" ||
    rawPurpose === "driver-registration" ||
    rawPurpose === "student-registration";

  const existingUser = await User.findOne(buildPhoneQuery(phoneNumber));

  if (isReg && existingUser) {
    throw new ApiError(
      409,
      "This mobile number is already registered. Please sign in instead."
    );
  }

  // 2. If purpose is provider or driver login, check that account exists
  if (
    rawPurpose === "provider-login" ||
    (rawPurpose === "login" && role === "provider")
  ) {
    if (!existingUser || existingUser.role !== "provider") {
      throw new ApiError(
        404,
        "No provider account found with this mobile number. Please apply as a provider first."
      );
    }
  }

  if (
    rawPurpose === "driver-login" ||
    (rawPurpose === "login" && role === "driver")
  ) {
    if (!existingUser || existingUser.role !== "driver") {
      throw new ApiError(
        404,
        "No driver account found with this mobile number. Please register as a driver first."
      );
    }
  }

  // 3. Enforce 60-second cooldown between OTP requests
  const now = new Date();
  const recentOtp = await PhoneOtp.findOne({
    normalizedPhoneNumber,
    purpose: rawPurpose
  }).sort({ createdAt: -1 });

  if (recentOtp && now.getTime() - new Date(recentOtp.lastSentAt).getTime() < 60000) {
    const waitSeconds = Math.ceil((60000 - (now.getTime() - new Date(recentOtp.lastSentAt).getTime())) / 1000);
    throw new ApiError(
      429,
      `Please wait ${waitSeconds} seconds before requesting another OTP.`
    );
  }

  // 4. Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(otp);

  // Expiry in 5 minutes
  const expiryMinutes = 5;
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  // Invalidate any older unverified OTPs for this phone + purpose
  await PhoneOtp.deleteMany({
    normalizedPhoneNumber,
    purpose: rawPurpose,
    verified: false
  });

  await PhoneOtp.create({
    phone: phoneNumber,
    phoneCountryCode,
    normalizedPhoneNumber,
    otpHash,
    purpose: rawPurpose,
    role,
    attempts: 0,
    maxAttempts: 5,
    verified: false,
    lastSentAt: now,
    expiresAt,
    ipAddress: req.ip || "",
    userAgent: req.get("user-agent") || ""
  });

  // 5. Send OTP via SMS service
  await sendSmsOtp({
    phone: phoneNumber,
    otp,
    purpose: rawPurpose
  });

  const responsePayload = {
    phone: phoneNumber,
    phoneCountryCode,
    normalizedPhoneNumber,
    resendAfterSeconds: 60,
    expiresInSeconds: expiryMinutes * 60
  };

  // Provide devOtp for development & test environments
  if (process.env.NODE_ENV !== "production") {
    responsePayload.devOtp = otp;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      responsePayload,
      `Verification OTP sent to +91 ${phoneNumber}. Valid for ${expiryMinutes} minutes.`
    )
  );
});

/**
 * 2. Verify OTP & Issue Single-Use Verification Token
 * POST /api/auth/phone/verify-otp or /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const rawPhone = String(req.body.phone || req.body.phoneNumber || req.body.mobile || "").trim();
  const rawOtp = String(req.body.otp || req.body.code || "").trim();
  const rawPurpose = String(req.body.purpose || "registration").trim();

  if (!rawPhone) {
    throw new ApiError(400, "Mobile number is required.");
  }
  if (!rawOtp || !/^\d{4,6}$/.test(rawOtp)) {
    throw new ApiError(400, "Please enter a valid 6-digit OTP code.");
  }

  const { phoneCountryCode, phoneNumber, normalizedPhoneNumber } =
    normalizePhoneNumber("+91", rawPhone);

  const now = new Date();
  const record = await PhoneOtp.findOne({
    normalizedPhoneNumber,
    purpose: rawPurpose,
    verified: false,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(
      400,
      "OTP is invalid or has expired. Please request a new code."
    );
  }

  if (record.attempts >= record.maxAttempts) {
    await PhoneOtp.deleteOne({ _id: record._id });
    throw new ApiError(
      400,
      "Maximum OTP attempts exceeded. Please request a new OTP."
    );
  }

  // Compare OTP hash
  if (record.otpHash !== hashOtp(rawOtp)) {
    record.attempts = (record.attempts || 0) + 1;
    await record.save();
    const remaining = record.maxAttempts - record.attempts;
    throw new ApiError(
      400,
      `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
    );
  }

  // Mark OTP as verified
  record.verified = true;
  record.verifiedAt = now;
  await record.save();

  // Map to unified PhoneVerificationSession purpose
  let sessionPurpose = "customer-registration";
  if (rawPurpose.includes("provider")) sessionPurpose = "provider-registration";
  else if (rawPurpose.includes("driver")) sessionPurpose = "driver-registration";
  else if (rawPurpose.includes("student")) sessionPurpose = "student-registration";
  else if (rawPurpose.includes("password")) sessionPurpose = "password-reset";
  else if (rawPurpose.includes("login")) sessionPurpose = "customer-login";

  // Create PhoneVerificationSession for registration / login consumption
  const rawToken = `pve_${crypto.randomBytes(32).toString("hex")}`;
  const referenceHash = hashToken(rawToken);
  const sessionExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await PhoneVerificationSession.create({
    referenceHash,
    phoneCountryCode,
    phoneNumber,
    normalizedPhoneNumber,
    purpose: sessionPurpose,
    used: false,
    expiresAt: sessionExpiry,
    ipAddress: req.ip || "",
    userAgent: req.get("user-agent") || ""
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        verified: true,
        verificationToken: rawToken,
        phone: phoneNumber,
        phoneCountryCode,
        normalizedPhoneNumber,
        expiresAt: sessionExpiry
      },
      "Mobile number verified successfully."
    )
  );
});

/**
 * 3. Unified Login with Mobile OTP (Customer, Provider, Driver)
 * POST /api/auth/phone/login-with-otp or /api/auth/login-with-otp
 */
const loginWithOtp = asyncHandler(async (req, res) => {
  const { phone, otp, verificationToken, role = "customer" } = req.body;
  let targetPhone = "";
  let targetNormalizedPhone = "";
  let targetCountryCode = "+91";

  // Mode A: Using verificationToken from previous verify step
  if (verificationToken) {
    const session = await consumeVerificationSession({
      verificationToken,
      expectedPurpose: "customer-login"
    });
    targetPhone = session.phoneNumber;
    targetNormalizedPhone = session.normalizedPhoneNumber;
    targetCountryCode = session.phoneCountryCode || "+91";
  }
  // Mode B: Direct phone + OTP verification
  else if (phone && otp) {
    const { phoneCountryCode, phoneNumber, normalizedPhoneNumber } =
      normalizePhoneNumber("+91", phone);

    if (!/^\d{4,6}$/.test(String(otp).trim())) {
      throw new ApiError(400, "Please enter a valid 6-digit OTP code.");
    }

    const record = await PhoneOtp.findOne({
      normalizedPhoneNumber,
      verified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!record) {
      throw new ApiError(400, "Invalid or expired OTP. Request a new code.");
    }

    if (record.otpHash !== hashOtp(otp)) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      throw new ApiError(400, "Incorrect OTP code.");
    }

    record.verified = true;
    record.verifiedAt = new Date();
    await record.save();

    targetPhone = phoneNumber;
    targetNormalizedPhone = normalizedPhoneNumber;
    targetCountryCode = phoneCountryCode;
  } else {
    throw new ApiError(
      400,
      "Either verificationToken or phone with OTP code is required."
    );
  }

  // Lookup existing user
  let user = await User.findOne(buildPhoneQuery(targetPhone)).select(
    "+password +refreshTokenHash"
  );

  let isNewUser = false;

  if (user) {
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated. Please contact support.");
    }

    // Role verification
    if (role && role !== "customer" && user.role !== role && user.role !== "admin") {
      throw new ApiError(
        403,
        `This mobile number belongs to a ${user.role} account. Please use the ${user.role} login portal.`
      );
    }

    // Provider approval status check
    if (user.role === "provider") {
      if (user.approvalStatus === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your registration is under review. Please wait for admin approval.",
          approvalStatus: "pending",
          registrationStatus: "pending",
          requiresApproval: true
        });
      }
      if (user.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your registration was rejected: ${user.rejectionReason || "Please contact administrator."}`,
          approvalStatus: "rejected",
          rejectionReason: user.rejectionReason,
          rejected: true
        });
      }
    }

    // Driver approval status check
    if (user.role === "driver") {
      if (user.approvalStatus === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your driver registration is under review. Please wait for admin approval.",
          approvalStatus: "pending",
          registrationStatus: "pending",
          requiresApproval: true
        });
      }
      if (user.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your driver registration was rejected: ${user.rejectionReason || "Please contact administrator."}`,
          approvalStatus: "rejected",
          rejectionReason: user.rejectionReason,
          rejected: true
        });
      }
    }

    // Update phone verification flag
    if (!user.phoneVerified) {
      user.phoneVerified = true;
      user.phoneVerifiedAt = new Date();
      user.phoneCountryCode = targetCountryCode;
      user.phoneNumber = targetPhone;
      user.normalizedPhoneNumber = targetNormalizedPhone;
      await user.save();
    }
  } else {
    // If user does not exist:
    // Only customer accounts can be auto-registered via OTP login
    if (role === "provider" || role === "driver" || role === "student") {
      throw new ApiError(
        404,
        `No registered ${role} account found for this mobile number. Please register first.`
      );
    }

    isNewUser = true;
    const defaultName = `Customer ${targetPhone.slice(-4)}`;
    const placeholderEmail = `phone_${targetPhone}@nukrentserve.local`;

    user = await User.create({
      name: defaultName,
      email: placeholderEmail,
      phone: targetPhone,
      phoneCountryCode: targetCountryCode,
      phoneNumber: targetPhone,
      normalizedPhoneNumber: targetNormalizedPhone,
      role: "customer",
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profileCompleted: false, // Customer must complete name & email
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
        ? "New customer account created and logged in via OTP."
        : "Authenticated successfully via Mobile OTP."
    )
  );
});

module.exports = {
  sendOtp,
  verifyOtp,
  loginWithOtp
};
