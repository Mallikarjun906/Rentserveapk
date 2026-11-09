const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const otpController = require("../controllers/otpController");
const controller = require("../controllers/authController");
const registrationController = require("../controllers/registrationController");
const providerApplicationController = require("../controllers/providerApplicationController");
const passwordResetController = require("../controllers/passwordResetController");

const { authenticate } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validateMiddleware");
const { uploadRegistrationFiles } = require("../middleware/identityUploadMiddleware");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
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
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many Google sign-in attempts. Please try again later."
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later."
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again later."
  }
});

// OTP endpoints
router.post("/send-otp", otpLimiter, otpController.send);
router.post("/verify-otp", otpLimiter, otpController.verify);

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

// 3. Password recovery
router.post(
  "/forgot-password",
  passwordResetLimiter,
  passwordResetController.forgotPassword
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  passwordResetController.resetPassword
);

module.exports = router;
