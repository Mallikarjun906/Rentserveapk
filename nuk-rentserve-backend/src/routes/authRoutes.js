const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const otpController = require("../controllers/otpController");
const controller = require("../controllers/authController");
const registrationController = require("../controllers/registrationController");
const providerApplicationController = require("../controllers/providerApplicationController");
const passwordResetController = require("../controllers/passwordResetController");
const phoneAuthController = require("../controllers/phoneAuthController");
const phoneOtpController = require("../controllers/phoneOtpController");

const { authenticate } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validateMiddleware");
const { uploadRegistrationFiles } = require("../middleware/identityUploadMiddleware");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again after 15 minutes."
  }
});

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many Google sign-in attempts. Please try again later."
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 10 : 100,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later."
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again later."
  }
});

const phoneVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many phone verification requests. Please try again later."
  }
});

// Phone.Email Verification Endpoints
router.post(
  "/phone-email/verify",
  phoneVerifyLimiter,
  phoneAuthController.verifyPhoneEmail
);

// Customer Mobile OTP Authentication & Registration
router.post(
  "/customer/phone-login",
  loginLimiter,
  phoneAuthController.customerPhoneLogin
);
router.post(
  "/customer/register",
  uploadRegistrationFiles,
  phoneAuthController.registerCustomerWithOtp
);

// Provider Registration & Approval-Gated Login
router.post(
  "/provider/register",
  uploadRegistrationFiles,
  phoneAuthController.registerProviderWithOtp
);
router.post(
  "/provider/login",
  loginLimiter,
  phoneAuthController.providerLogin
);

// Password Reset via OTP
router.post(
  "/password/forgot",
  passwordResetLimiter,
  (req, res, next) => {
    if (req.body?.verificationToken) {
      return phoneAuthController.forgotPasswordWithOtp(req, res, next);
    }
    return passwordResetController.forgotPassword(req, res, next);
  }
);
router.post(
  "/password/reset",
  passwordResetLimiter,
  (req, res, next) => {
    if (req.body?.resetToken || req.body?.newPassword) {
      return phoneAuthController.resetPasswordWithOtp(req, res, next);
    }
    return passwordResetController.resetPassword(req, res, next);
  }
);

// Customer Profile Completion
router.put(
  "/customer/profile",
  authenticate,
  uploadRegistrationFiles,
  phoneAuthController.updateCustomerProfile
);

// Native Phone OTP & Login Endpoints
router.post("/phone/send-otp", otpLimiter, phoneOtpController.sendOtp);
router.post("/phone/verify-otp", otpLimiter, phoneOtpController.verifyOtp);
router.post("/phone/login-with-otp", loginLimiter, phoneOtpController.loginWithOtp);
router.post("/login-with-otp", loginLimiter, phoneOtpController.loginWithOtp);

// Dual-mode OTP endpoints (supporting both mobile phone and legacy email)
router.post("/send-otp", otpLimiter, (req, res, next) => {
  if (req.body.phone || req.body.phoneNumber || req.body.mobile) {
    return phoneOtpController.sendOtp(req, res, next);
  }
  return otpController.send(req, res, next);
});

router.post("/verify-otp", otpLimiter, (req, res, next) => {
  if (req.body.phone || req.body.phoneNumber || req.body.mobile) {
    return phoneOtpController.verifyOtp(req, res, next);
  }
  return otpController.verify(req, res, next);
});

// 1. Separate Registration Endpoints
const normalizeLocation = (req, _res, next) => {
  if (!req.body.location && req.body.city) {
    req.body.location = req.body.city;
  }
  if (!req.body.location) {
    req.body.location = "Bagalkot";
  }
  next();
};

router.post("/register/customer", uploadRegistrationFiles, registrationController.registerCustomer);
router.post("/register/owner", uploadRegistrationFiles, registrationController.registerOwner);
router.post("/register/driver", uploadRegistrationFiles, registrationController.registerDriver);
router.post("/register/student", uploadRegistrationFiles, registrationController.registerStudent);
router.post("/register/provider", uploadRegistrationFiles, providerApplicationController.submit);

// Backward-compatible generic registration
router.post(
  "/register",
  normalizeLocation,
  validateBody(["name", "email", "phone", "password", "location"]),
  controller.register
);

// 2. Authentication
const jwt = require("jsonwebtoken");
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  let token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token && req.query && req.query.token) {
    token = String(req.query.token).trim();
  }
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = { id: payload.sub };
    } catch {}
  }
  next();
};

router.post("/login", loginLimiter, controller.login);
router.post("/admin/login", loginLimiter, controller.adminLogin);
router.post("/refresh", controller.refresh);
router.post("/logout", optionalAuth, controller.logout);
router.post("/google", googleAuthLimiter, controller.googleLogin);

// 3. Password recovery (supports both Phone.Email OTP and legacy email)
router.post(
  "/forgot-password",
  passwordResetLimiter,
  (req, res, next) => {
    if (req.body?.verificationToken) {
      return phoneAuthController.forgotPasswordWithOtp(req, res, next);
    }
    return passwordResetController.forgotPassword(req, res, next);
  }
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  (req, res, next) => {
    if (req.body?.resetToken || req.body?.newPassword) {
      return phoneAuthController.resetPasswordWithOtp(req, res, next);
    }
    return passwordResetController.resetPassword(req, res, next);
  }
);

module.exports = router;
