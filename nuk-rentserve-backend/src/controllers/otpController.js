const crypto = require("crypto");
const EmailOtp = require("../models/EmailOtp");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { sendOtp } = require("../services/emailService");

const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const VALID_PURPOSES = new Set([
  "customer-registration",
  "provider-registration",
  "driver-registration",
  "student-registration",
  "registration",
  "login",
  "customer-login",
  "provider-login",
  "driver-login",
  "password-reset",
  "forgot-password",
  "profile-verification"
]);

const validatePurpose = (purpose) => {
  const p = String(purpose || "").trim().toLowerCase();
  if (!p || (!VALID_PURPOSES.has(p) && p !== "customer-registration")) {
    throw new ApiError(400, "Invalid registration purpose.");
  }
  return p;
};

const send = asyncHandler(async (req, res, next) => {
  // Delegate to Phone OTP controller if mobile phone number is provided
  if (req.body.phone || req.body.phoneNumber || req.body.mobile) {
    const phoneOtpController = require("./phoneOtpController");
    return phoneOtpController.sendOtp(req, res, next);
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  const purpose = validatePurpose(req.body.purpose);

  if (!validEmail(email)) {
    throw new ApiError(400, "Enter a valid email address.");
  }

  const isReg =
    purpose === "customer-registration" ||
    purpose === "registration";

  if (isReg && (await User.exists({ email }))) {
    throw new ApiError(409, "This email is already registered.");
  }

  const now = new Date();
  const latest = await EmailOtp.findOne({
    email,
    purpose: "customer-registration"
  }).sort({ createdAt: -1 });

  if (latest && now.getTime() - new Date(latest.lastSentAt).getTime() < 60000) {
    throw new ApiError(429, "Please wait 60 seconds before requesting another OTP.");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  try {
    await sendOtp(email, otp);
  } catch (error) {
    console.error("OTP email delivery failed:", error.message);
    throw new ApiError(503, "Email delivery failed. Check your email configuration.");
  }

  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
  await EmailOtp.create({
    email,
    purpose: "customer-registration",
    otpHash: hash(otp),
    expiresAt: new Date(now.getTime() + expiryMinutes * 60000),
    lastSentAt: now,
    attempts: 0,
    verifiedAt: null,
    consumedAt: null
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { expiresInSeconds: expiryMinutes * 60, resendAfterSeconds: 60 },
      "Verification code sent if the email can receive messages."
    )
  );
});

const verify = asyncHandler(async (req, res, next) => {
  // Delegate to Phone OTP controller if mobile phone number is provided
  if (req.body.phone || req.body.phoneNumber || req.body.mobile) {
    const phoneOtpController = require("./phoneOtpController");
    return phoneOtpController.verifyOtp(req, res, next);
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();
  validatePurpose(req.body.purpose);

  if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
    throw new ApiError(400, "Enter a valid email and six-digit OTP.");
  }

  const record = await EmailOtp.findOne({
    email,
    purpose: "customer-registration",
    consumedAt: null
  }).sort({ createdAt: -1 });

  if (
    !record ||
    record.expiresAt <= new Date() ||
    record.verifiedAt ||
    (record.attempts || 0) >= 5
  ) {
    throw new ApiError(400, "OTP is invalid or expired. Request a new code.");
  }

  if (record.otpHash !== hash(otp)) {
    record.attempts = (record.attempts || 0) + 1;
    await record.save();
    throw new ApiError(400, "Incorrect OTP.");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  record.verifiedAt = new Date();
  record.verificationTokenHash = hash(verificationToken);
  await record.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { verificationToken, email, expiresInSeconds: 600 },
      "Email verified successfully."
    )
  );
});

module.exports = { send, verify };
