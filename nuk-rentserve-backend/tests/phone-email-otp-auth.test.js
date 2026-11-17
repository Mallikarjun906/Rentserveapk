const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../src/models/User");
const ServiceProvider = require("../src/models/ServiceProvider");
const ProviderApplication = require("../src/models/ProviderApplication");
const PasswordResetToken = require("../src/models/PasswordResetToken");
const PhoneVerificationSession = require("../src/models/PhoneVerificationSession");

jest.mock("../src/config/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options, callback) => ({
        end: () =>
          callback(null, {
            secure_url: "https://images.example.test/mock-photo.jpg",
            public_id: `test-upload-${Math.random().toString(36).slice(2)}`
          })
      })
    }
  },
  cloudinaryConfigured: true
}));

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      downloadDir: "D:\\mongodb-binaries"
    }
  });
  await mongoose.connect(mongoServer.getUri());
  app = require("../src/app");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    ServiceProvider.deleteMany({}),
    ProviderApplication.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    PhoneVerificationSession.deleteMany({})
  ]);
});

describe("Phone.Email Mobile OTP Authentication & Security Suite", () => {
  // Helper to generate a verified session in test mode
  async function createVerifiedToken(phoneNumber, purpose) {
    const mockUrl = `https://auth.phone.email/test-mock?mock_phone=${phoneNumber}&mock_cc=%2B91&t=${Date.now()}_${Math.random()}`;
    const res = await request(app)
      .post("/api/v1/auth/phone-email/verify")
      .send({ user_json_url: mockUrl, purpose });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    return res.body.data.verificationToken;
  }

  /* --------------------------------------------------------------------------
   * 1. CUSTOMER REGISTRATION WITH PHONE.EMAIL OTP
   * -------------------------------------------------------------------------- */
  describe("1. Customer Registration with Phone.Email OTP", () => {
    test("Successfully registers a new customer with verified mobile number", async () => {
      const token = await createVerifiedToken(
        "9876543210",
        "customer-registration"
      );

      const regRes = await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "Ramesh Patil",
          email: "ramesh@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: token,
          address: "Station Road",
          city: "Bagalkot",
          terms: true
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.user.role).toBe("customer");
      expect(regRes.body.data.user.phoneVerified).toBe(true);
      expect(regRes.body.data.user.phone).toBe("9876543210");
      expect(regRes.body.data.user.phoneCountryCode).toBe("+91");
      expect(regRes.body.data.user.approvalStatus).toBe("approved");
      expect(regRes.body.data.accessToken).toBeDefined();

      const inDb = await User.findOne({ email: "ramesh@example.com" });
      expect(inDb).not.toBeNull();
      expect(inDb.phoneVerified).toBe(true);
      expect(inDb.phoneVerifiedAt).toBeInstanceOf(Date);
      expect(inDb.normalizedPhoneNumber).toBe("+919876543210");
    });

    test("Rejects registration when verification token is missing or invalid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "Ramesh Patil",
          email: "ramesh2@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: "invalid_fake_token",
          city: "Bagalkot",
          terms: true
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|verification/i);
    });

    test("Prevents duplicate registration with the same verified phone number", async () => {
      const token1 = await createVerifiedToken(
        "9876543210",
        "customer-registration"
      );
      await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "First User",
          email: "first@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: token1,
          city: "Bagalkot",
          terms: true
        });

      const token2 = await createVerifiedToken(
        "9876543210",
        "customer-registration"
      );
      const dupRes = await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "Second User",
          email: "second@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: token2,
          city: "Bagalkot",
          terms: true
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.message).toMatch(/already registered/i);
    });
  });

  /* --------------------------------------------------------------------------
   * 2. CUSTOMER MOBILE OTP LOGIN (PASSWORDLESS)
   * -------------------------------------------------------------------------- */
  describe("2. Customer Mobile OTP Login", () => {
    test("Authenticates existing customer via OTP without password, preserving password", async () => {
      const hashedPassword = await bcrypt.hash("OriginalCustomerPass!", 12);
      const existingUser = await User.create({
        name: "Existing Customer",
        email: "existing@example.com",
        phone: "9876543211",
        phoneNumber: "9876543211",
        normalizedPhoneNumber: "+919876543211",
        password: hashedPassword,
        role: "customer",
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        location: "Bagalkot"
      });

      const loginToken = await createVerifiedToken(
        "9876543211",
        "customer-login"
      );
      const loginRes = await request(app)
        .post("/api/v1/auth/customer/phone-login")
        .send({ verificationToken: loginToken });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe("existing@example.com");
      expect(loginRes.body.data.isNewUser).toBe(false);
      expect(loginRes.body.data.accessToken).toBeDefined();

      // Ensure password was untouched
      const afterLogin = await User.findById(existingUser._id).select("+password");
      expect(afterLogin.password).toBe(hashedPassword);
    });

    test("Auto-creates and authenticates a new customer account via Mobile OTP", async () => {
      const token = await createVerifiedToken(
        "9876543299",
        "customer-login"
      );

      const res = await request(app)
        .post("/api/v1/auth/customer/phone-login")
        .send({ verificationToken: token });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isNewUser).toBe(true);
      expect(res.body.data.user.role).toBe("customer");
      expect(res.body.data.user.phoneVerified).toBe(true);
      expect(res.body.data.user.profileCompleted).toBe(false);

      const dbUser = await User.findOne({ phone: "9876543299" });
      expect(dbUser).not.toBeNull();
      expect(dbUser.role).toBe("customer");
    });

    test("Customer profile completion after OTP login", async () => {
      const token = await createVerifiedToken(
        "9876543288",
        "customer-login"
      );
      const loginRes = await request(app)
        .post("/api/v1/auth/customer/phone-login")
        .send({ verificationToken: token });

      const jwtToken = loginRes.body.data.accessToken;

      const profileRes = await request(app)
        .put("/api/v1/customer/profile")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send({
          name: "Suresh Bellad",
          email: "suresh.bellad@example.com",
          location: "Ilkal, Bagalkot",
          address: "Main Bazar"
        });

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.name).toBe("Suresh Bellad");
      expect(profileRes.body.data.email).toBe("suresh.bellad@example.com");
      expect(profileRes.body.data.profileCompleted).toBe(true);
    });

    test("Strict role separation: Provider or Admin cannot authenticate via customer OTP login", async () => {
      // Create a provider account
      await User.create({
        name: "Trade Provider",
        email: "provider.otp@example.com",
        phone: "9876543277",
        phoneNumber: "9876543277",
        normalizedPhoneNumber: "+919876543277",
        role: "provider",
        approvalStatus: "approved",
        location: "Bagalkot"
      });

      const token = await createVerifiedToken(
        "9876543277",
        "customer-login"
      );
      const res = await request(app)
        .post("/api/v1/auth/customer/phone-login")
        .send({ verificationToken: token });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/belongs to a provider/i);
    });
  });

  /* --------------------------------------------------------------------------
   * 3. PROVIDER REGISTRATION & APPROVAL-GATED LOGIN
   * -------------------------------------------------------------------------- */
  describe("3. Provider Registration & Approval Workflow", () => {
    test("Rejects provider registration when OTP verification is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/provider/register")
        .send({
          fullName: "Basavaraj Plumber",
          email: "basavaraj@example.com",
          password: "SecurePassword123!",
          city: "Bagalkot",
          category: "Plumber",
          experience: "5 years",
          terms: true
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/OTP verification is required/i);
    });

    test("Successfully registers provider with OTP and sets status to pending", async () => {
      const token = await createVerifiedToken(
        "9876543266",
        "provider-registration"
      );

      const res = await request(app)
        .post("/api/v1/auth/provider/register")
        .send({
          fullName: "Basavaraj Plumber",
          email: "basavaraj@example.com",
          password: "SecurePassword123!",
          city: "Bagalkot",
          category: "Plumber",
          experience: "5 years",
          serviceArea: "Bagalkot district",
          terms: true,
          consent: true,
          verificationToken: token
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe("provider");
      expect(res.body.data.user.approvalStatus).toBe("pending");
      expect(res.body.data.user.phoneVerified).toBe(true);
      expect(res.body.data.application.status).toBe("pending");

      const inDb = await User.findOne({ email: "basavaraj@example.com" });
      expect(inDb.approvalStatus).toBe("pending");
      expect(inDb.phoneVerified).toBe(true);
    });

    test("Pending provider login is blocked with explicit review message", async () => {
      const token = await createVerifiedToken(
        "9876543255",
        "provider-registration"
      );
      await request(app)
        .post("/api/v1/auth/provider/register")
        .send({
          fullName: "Pending Provider",
          email: "pending.provider@example.com",
          password: "SecurePassword123!",
          city: "Bagalkot",
          category: "Carpenter",
          terms: true,
          consent: true,
          verificationToken: token
        });

      const loginRes = await request(app)
        .post("/api/v1/auth/provider/login")
        .send({
          identifier: "pending.provider@example.com",
          password: "SecurePassword123!"
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.message).toBe(
        "Your registration is under review. Please wait for admin approval."
      );
    });

    test("Rejected provider login displays appropriate rejection reason", async () => {
      const hashedPassword = await bcrypt.hash("SecurePassword123!", 12);
      await User.create({
        name: "Rejected Provider",
        email: "rejected.provider@example.com",
        phone: "9876543244",
        phoneNumber: "9876543244",
        normalizedPhoneNumber: "+919876543244",
        password: hashedPassword,
        role: "provider",
        approvalStatus: "rejected",
        rejectionReason: "Trade certificate document was illegible.",
        phoneVerified: true,
        location: "Bagalkot"
      });

      const loginRes = await request(app)
        .post("/api/v1/auth/provider/login")
        .send({
          identifier: "rejected.provider@example.com",
          password: "SecurePassword123!"
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.message).toMatch(/rejected by administrator/i);
      expect(loginRes.body.message).toMatch(/Trade certificate document was illegible/i);
    });

    test("Approved provider can log in successfully", async () => {
      const hashedPassword = await bcrypt.hash("SecurePassword123!", 12);
      await User.create({
        name: "Approved Provider",
        email: "approved.provider@example.com",
        phone: "9876543233",
        phoneNumber: "9876543233",
        normalizedPhoneNumber: "+919876543233",
        password: hashedPassword,
        role: "provider",
        approvalStatus: "approved",
        phoneVerified: true,
        location: "Bagalkot"
      });

      const loginRes = await request(app)
        .post("/api/v1/auth/provider/login")
        .send({
          identifier: "approved.provider@example.com",
          password: "SecurePassword123!"
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.role).toBe("provider");
      expect(loginRes.body.data.accessToken).toBeDefined();
    });
  });

  /* --------------------------------------------------------------------------
   * 4. FORGOT PASSWORD WITH PHONE.EMAIL OTP VERIFICATION
   * -------------------------------------------------------------------------- */
  describe("4. Password Reset with Phone.Email OTP", () => {
    test("Completes full password reset flow with OTP, updates password, revokes old sessions", async () => {
      const initialHash = await bcrypt.hash("OldPassword123!", 12);
      const user = await User.create({
        name: "Reset Target",
        email: "reset.target@example.com",
        phone: "9876543222",
        phoneNumber: "9876543222",
        normalizedPhoneNumber: "+919876543222",
        password: initialHash,
        refreshTokenHash: "old_refresh_token_hash_123",
        role: "customer",
        phoneVerified: true,
        location: "Bagalkot"
      });

      // 1. Verify phone with Phone.Email for password-reset
      const otpToken = await createVerifiedToken(
        "9876543222",
        "password-reset"
      );

      // 2. Request password reset authorization
      const forgotRes = await request(app)
        .post("/api/v1/auth/password/forgot")
        .send({ verificationToken: otpToken });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      const resetToken = forgotRes.body.data.resetToken;
      expect(resetToken).toBeDefined();

      // 3. Set new password
      const resetRes = await request(app)
        .post("/api/v1/auth/password/reset")
        .send({
          resetToken,
          newPassword: "BrandNewPassword2026!",
          confirmPassword: "BrandNewPassword2026!"
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toMatch(/Password reset successfully/i);

      // Verify DB changes
      const updatedUser = await User.findById(user._id).select(
        "+password +refreshTokenHash"
      );
      expect(await bcrypt.compare("BrandNewPassword2026!", updatedUser.password)).toBe(true);
      expect(await bcrypt.compare("OldPassword123!", updatedUser.password)).toBe(false);
      expect(updatedUser.refreshTokenHash).toBeUndefined(); // Revoked old session

      // 4. Verify single-use: Reusing resetToken must fail
      const reuseRes = await request(app)
        .post("/api/v1/auth/password/reset")
        .send({
          resetToken,
          newPassword: "AnotherPassword123!",
          confirmPassword: "AnotherPassword123!"
        });

      expect(reuseRes.status).toBe(400);
      expect(reuseRes.body.message).toMatch(/invalid or expired/i);
    });

    test("Rejects password reset when passwords do not match", async () => {
      const initialHash = await bcrypt.hash("OldPassword123!", 12);
      await User.create({
        name: "Mismatch User",
        email: "mismatch@example.com",
        phone: "9876543201",
        phoneNumber: "9876543201",
        normalizedPhoneNumber: "+919876543201",
        password: initialHash,
        role: "customer",
        phoneVerified: true,
        location: "Bagalkot"
      });

      const otpToken = await createVerifiedToken(
        "9876543201",
        "password-reset"
      );
      const forgotRes = await request(app)
        .post("/api/v1/auth/password/forgot")
        .send({ verificationToken: otpToken });

      const resetToken = forgotRes.body.data.resetToken;

      const resetRes = await request(app)
        .post("/api/v1/auth/password/reset")
        .send({
          resetToken,
          newPassword: "PassOne123!",
          confirmPassword: "DifferentPass456!"
        });

      expect(resetRes.status).toBe(400);
      expect(resetRes.body.message).toMatch(/do not match/i);
    });
  });

  /* --------------------------------------------------------------------------
   * 5. SECURITY & REPLAY / SSRF PROTECTION
   * -------------------------------------------------------------------------- */
  describe("5. Security, Replay and SSRF Protection", () => {
    test("Blocks SSRF attacks: rejects non-HTTPS and untrusted hostnames", async () => {
      const badUrls = [
        "http://auth.phone.email/userjson/test",
        "https://localhost:5000/api/secret",
        "https://127.0.0.1/malicious",
        "https://169.254.169.254/latest/meta-data",
        "https://attacker-controlled.site/steal"
      ];

      for (const badUrl of badUrls) {
        const res = await request(app)
          .post("/api/v1/auth/phone-email/verify")
          .send({
            user_json_url: badUrl,
            purpose: "customer-registration"
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/untrusted|protocol|format|ip/i);
      }
    });

    test("Replay protection: prevents verifying the same user_json_url twice", async () => {
      const url = `https://auth.phone.email/test-mock?mock_phone=9876543111&t=${Date.now()}`;

      const res1 = await request(app)
        .post("/api/v1/auth/phone-email/verify")
        .send({ user_json_url: url, purpose: "customer-login" });
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post("/api/v1/auth/phone-email/verify")
        .send({ user_json_url: url, purpose: "customer-login" });
      expect(res2.status).toBe(409);
      expect(res2.body.message).toMatch(/already been processed/i);
    });

    test("Cross-purpose token reuse forbidden: customer-registration token cannot be used for password-reset", async () => {
      const token = await createVerifiedToken(
        "9876543112",
        "customer-registration"
      );

      const res = await request(app)
        .post("/api/v1/auth/password/forgot")
        .send({ verificationToken: token });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cross-purpose token reuse forbidden/i);
    });

    test("Single-use token: once consumed, token cannot be reused for another action", async () => {
      const token = await createVerifiedToken(
        "9876543113",
        "customer-registration"
      );

      const reg1 = await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "Single Use User",
          email: "singleuse1@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: token,
          city: "Bagalkot",
          terms: true
        });
      expect(reg1.status).toBe(201);

      // Reusing token
      const reg2 = await request(app)
        .post("/api/v1/auth/customer/register")
        .send({
          name: "Reuse Attempt",
          email: "singleuse2@example.com",
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
          verificationToken: token,
          city: "Bagalkot",
          terms: true
        });
      expect(reg2.status).toBe(400);
      expect(reg2.body.message).toMatch(/already been used/i);
    });
  });
});
