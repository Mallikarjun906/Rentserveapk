const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const PhoneVerificationSession = require("../models/PhoneVerificationSession");
const ApiError = require("../utils/ApiError");
const { normalizePhoneNumber } = require("../utils/phoneUtils");

const PHONE_EMAIL_CLIENT_ID =
  process.env.PHONE_EMAIL_CLIENT_ID || "18875442659397262084";

const MAX_RESPONSE_BYTES = 50 * 1024; // 50 KB limit
const FETCH_TIMEOUT_MS = 8000; // 8 seconds

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/**
 * Validates that a user_json_url is safe, uses HTTPS, and targets Phone.Email official domains.
 * Defends against SSRF, DNS rebinding to private IPs, and protocol attacks.
 */
function validateUserJsonUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new ApiError(400, "user_json_url is required.");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new ApiError(400, "Invalid verification URL format.");
  }

  if (parsed.protocol !== "https:") {
    throw new ApiError(400, "Verification URL must use secure HTTPS protocol.");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Enforce Phone.Email official domain
  const isOfficialDomain =
    hostname === "phone.email" ||
    hostname === "auth.phone.email" ||
    hostname === "user.phone.email" ||
    hostname.endsWith(".phone.email");

  // Allow mock URL specifically in test environment
  const isTestMock =
    process.env.NODE_ENV === "test" &&
    (hostname === "auth.phone.email" || hostname === "mock.phone.email");

  if (!isOfficialDomain && !isTestMock) {
    throw new ApiError(
      400,
      "Untrusted verification provider. The URL must belong to official Phone.Email services."
    );
  }

  // Reject IP literals
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes("[")) {
    throw new ApiError(400, "IP addresses are not permitted as verification hosts.");
  }

  // Reject non-standard ports
  if (parsed.port && parsed.port !== "443") {
    throw new ApiError(400, "Invalid port for verification service.");
  }

  return parsed.toString();
}

/**
 * Fetches and validates verified user information from Phone.Email user_json_url.
 */
async function fetchVerifiedPhoneData(validatedUrl) {
  const urlObj = new URL(validatedUrl);

  // In test environment, support deterministic test mocks without external HTTP calls
  if (
    process.env.NODE_ENV === "test" &&
    urlObj.searchParams.has("mock_phone")
  ) {
    const mockCc = urlObj.searchParams.get("mock_cc") || "+91";
    const mockPhone = urlObj.searchParams.get("mock_phone");
    return {
      user_country_code: mockCc,
      user_phone_number: mockPhone,
      user_first_name: urlObj.searchParams.get("mock_first_name") || "",
      user_last_name: urlObj.searchParams.get("mock_last_name") || "",
      user_email_id: urlObj.searchParams.get("mock_email") || ""
    };
  }

  let response;
  try {
    response = await fetch(validatedUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NUK-RentServe-Verifier/1.0"
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new ApiError(
        504,
        "Phone.Email verification service timed out. Please try again."
      );
    }
    throw new ApiError(
      502,
      "Unable to reach Phone.Email verification server. Please verify your internet connection."
    );
  }

  if (!response.ok) {
    throw new ApiError(
      400,
      `Phone.Email verification failed with status: ${response.status}.`
    );
  }

  // Enforce response size limits
  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength && contentLength > MAX_RESPONSE_BYTES) {
    throw new ApiError(400, "Verification payload exceeds acceptable size limit.");
  }

  const rawText = await response.text();
  if (rawText.length > MAX_RESPONSE_BYTES) {
    throw new ApiError(400, "Verification response too large.");
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new ApiError(502, "Invalid JSON payload returned by verification provider.");
  }

  const phone =
    data.user_phone_number ||
    data.user_phone_no ||
    data.phone_number ||
    data.phone;

  if (!phone) {
    throw new ApiError(
      400,
      "Verification payload did not include a valid verified phone number."
    );
  }

  return data;
}

function normalizeVerificationPurpose(rawPurpose) {
  if (!rawPurpose) return "customer-registration";
  const p = String(rawPurpose).trim().toLowerCase();
  if (p === "login" || p === "customer-login") return "customer-login";
  if (p === "registration" || p === "customer-registration") return "customer-registration";
  if (p === "provider-login") return "provider-login";
  if (p === "driver-login") return "driver-login";
  if (p === "provider-registration") return "provider-registration";
  if (p === "driver-registration") return "driver-registration";
  if (p === "student-registration") return "student-registration";
  if (p === "password-reset" || p === "forgot-password") return "password-reset";
  if (p === "profile-verification") return "profile-verification";
  return p;
}

/**
 * Verifies Phone.Email JWT token signed with account private API Key (HS256)
 */
function verifyPhoneEmailJwt(token) {
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Phone.Email verification token is required.");
  }

  const apiKey = (process.env.PHONE_EMAIL_API_KEY || "o9l6U47i3BvhYRp6iCHuNhdAkY944oEP").trim();
  if (!apiKey) {
    throw new ApiError(500, "PHONE_EMAIL_API_KEY is not configured on the server.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token.trim(), apiKey, { algorithms: ["HS256"] });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Phone.Email verification token has expired. Please verify again.");
    }
    throw new ApiError(401, `Phone.Email token verification failed: ${err.message}`);
  }

  // Validate claims
  if (decoded.iss && decoded.iss !== "phmail" && !decoded.iss.includes("phone.email")) {
    throw new ApiError(401, "Invalid Phone.Email token issuer.");
  }

  const phone =
    decoded.phone_no ||
    decoded.user_phone_number ||
    decoded.phone_number ||
    decoded.phone;

  if (!phone) {
    throw new ApiError(400, "Phone.Email token did not contain a valid verified phone number.");
  }

  return {
    user_country_code: decoded.country_code || decoded.user_country_code || "+91",
    user_phone_number: String(phone).replace(/\D/g, "").slice(-10),
    user_first_name: decoded.first_name || decoded.user_first_name || "",
    user_last_name: decoded.last_name || decoded.user_last_name || "",
    user_email_id: decoded.email || decoded.user_email_id || ""
  };
}

/**
 * Verifies user_json_url or JWT token and creates a single-use, short-lived verification session.
 */
async function processPhoneVerification({
  user_json_url,
  token,
  purpose: rawPurpose,
  ipAddress = "",
  userAgent = ""
}) {
  const allowedPurposes = [
    "customer-registration",
    "customer-login",
    "provider-login",
    "driver-login",
    "provider-registration",
    "driver-registration",
    "student-registration",
    "password-reset",
    "profile-verification"
  ];

  const purpose = normalizeVerificationPurpose(rawPurpose);

  if (!allowedPurposes.includes(purpose)) {
    throw new ApiError(400, "Invalid verification purpose.");
  }

  let verifiedData;
  let identifierHash;

  if (token) {
    identifierHash = hashToken(token);
    // Prevent replay of the exact same token
    const existingSessionWithToken = await PhoneVerificationSession.findOne({
      urlHash: identifierHash
    });
    if (existingSessionWithToken) {
      throw new ApiError(
        409,
        "This verification token has already been processed. Please complete a new verification."
      );
    }
    verifiedData = verifyPhoneEmailJwt(token);
  } else if (user_json_url) {
    const validatedUrl = validateUserJsonUrl(user_json_url);
    identifierHash = hashToken(validatedUrl);

    // Prevent replay of the exact same user_json_url
    const existingSessionWithUrl = await PhoneVerificationSession.findOne({
      urlHash: identifierHash
    });
    if (existingSessionWithUrl) {
      throw new ApiError(
        409,
        "This verification URL has already been processed. Please complete a new verification."
      );
    }

    verifiedData = await fetchVerifiedPhoneData(validatedUrl);
  } else {
    throw new ApiError(400, "Either token or user_json_url must be provided for verification.");
  }

  const rawCc = verifiedData.user_country_code || "+91";
  const rawPhone =
    verifiedData.user_phone_number ||
    verifiedData.user_phone_no ||
    verifiedData.phone_number ||
    "";

  const { phoneCountryCode, phoneNumber, normalizedPhoneNumber } =
    normalizePhoneNumber(rawCc, rawPhone);

  if (!phoneNumber || phoneNumber.length < 7 || phoneNumber.length > 15) {
    throw new ApiError(400, "Verified phone number has an invalid length.");
  }

  // Generate secure single-use reference token
  const rawToken = `pve_${crypto.randomBytes(32).toString("hex")}`;
  const referenceHash = hashToken(rawToken);

  // Verification token expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await PhoneVerificationSession.create({
    referenceHash,
    phoneCountryCode,
    phoneNumber,
    normalizedPhoneNumber,
    purpose,
    used: false,
    expiresAt,
    urlHash: identifierHash,
    ipAddress,
    userAgent
  });

  return {
    verificationToken: rawToken,
    phoneCountryCode,
    phoneNumber,
    normalizedPhoneNumber,
    firstName: verifiedData.user_first_name || "",
    lastName: verifiedData.user_last_name || "",
    email: verifiedData.user_email_id || "",
    expiresAt
  };
}

/**
 * Validates and atomically consumes a verification reference token for a specific purpose.
 * Protects against race condition replay, token reuse, cross-purpose abuse, and expired tokens.
 */
async function consumeVerificationSession({
  verificationToken,
  expectedPurpose
}) {
  if (!verificationToken || typeof verificationToken !== "string") {
    throw new ApiError(400, "Phone verification token is required.");
  }

  const tokenHash = hashToken(verificationToken);

  const normExpected = normalizeVerificationPurpose(expectedPurpose);
  // Compatible purposes
  let allowedPurposes = [normExpected, expectedPurpose];
  if (normExpected.includes("registration")) {
    allowedPurposes.push("registration", "customer-registration");
  } else if (normExpected.includes("login")) {
    allowedPurposes.push("login", "customer-login");
  }

  // Attempt atomic find and consume
  const session = await PhoneVerificationSession.findOneAndUpdate(
    {
      referenceHash: tokenHash,
      purpose: { $in: allowedPurposes },
      used: false,
      expiresAt: { $gt: new Date() }
    },
    {
      $set: {
        used: true,
        usedAt: new Date()
      }
    },
    { new: true }
  );

  if (session) {
    return {
      phoneCountryCode: session.phoneCountryCode,
      phoneNumber: session.phoneNumber,
      normalizedPhoneNumber: session.normalizedPhoneNumber,
      purpose: session.purpose
    };
  }

  // Investigate reason for informative, secure error handling
  const existing = await PhoneVerificationSession.findOne({ referenceHash: tokenHash });

  if (!existing) {
    throw new ApiError(400, "Invalid phone verification token.");
  }

  if (existing.used) {
    throw new ApiError(
      400,
      "This phone verification has already been used. Please verify again."
    );
  }

  if (existing.purpose !== expectedPurpose) {
    throw new ApiError(
      403,
      `Cross-purpose token reuse forbidden. This verification was issued for '${existing.purpose}', not '${expectedPurpose}'.`
    );
  }

  if (existing.expiresAt <= new Date()) {
    throw new ApiError(
      400,
      "Phone verification has expired. Please verify your mobile number again."
    );
  }

  throw new ApiError(400, "Phone verification could not be validated.");
}

module.exports = {
  PHONE_EMAIL_CLIENT_ID,
  validateUserJsonUrl,
  verifyPhoneEmailJwt,
  processPhoneVerification,
  consumeVerificationSession,
  hashToken
};
