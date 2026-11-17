const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const PhoneOtp = require("../src/models/PhoneOtp");
const PhoneVerificationSession = require("../src/models/PhoneVerificationSession");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await PhoneOtp.deleteMany({});
  await PhoneVerificationSession.deleteMany({});
});

describe("Native Phone OTP Authentication & Registration Suite", () => {
  const testPhone = "9876543210";

  test("1. Send OTP: successfully sends OTP for valid Indian mobile", async () => {
    const res = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(testPhone);
    expect(res.body.data.resendAfterSeconds).toBe(60);
    expect(res.body.data.devOtp).toMatch(/^\d{6}$/);

    // Verify record in database
    const record = await PhoneOtp.findOne({ phone: testPhone });
    expect(record).not.toBeNull();
    expect(record.verified).toBe(false);
  });

  test("2. Send OTP: rejects invalid phone number", async () => {
    const res = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: "12345", purpose: "customer-registration" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid 10-digit Indian mobile/i);
  });

  test("3. Send OTP: rejects duplicate phone number for registration", async () => {
    // Create existing user with this phone
    await User.create({
      name: "Existing User",
      email: "existing@example.com",
      phone: testPhone,
      phoneNumber: testPhone,
      normalizedPhoneNumber: `+91${testPhone}`,
      role: "customer"
    });

    const res = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test("4. Send OTP: enforces 60-second cooldown on rapid resend", async () => {
    // First send
    await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    // Immediate second send
    const res = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Please wait.*seconds/i);
  });

  test("5. Verify OTP: rejects incorrect OTP code", async () => {
    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    const verifyRes = await request(app)
      .post("/api/v1/auth/phone/verify-otp")
      .send({ phone: testPhone, otp: "000000", purpose: "customer-registration" });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.message).toMatch(/Incorrect OTP/i);
  });

  test("6. Verify OTP: successfully verifies correct code and issues verificationToken", async () => {
    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    const otpCode = sendRes.body.data.devOtp;

    const verifyRes = await request(app)
      .post("/api/v1/auth/phone/verify-otp")
      .send({ phone: testPhone, otp: otpCode, purpose: "customer-registration" });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);
    expect(verifyRes.body.data.verificationToken).toMatch(/^pve_/);

    // Verify session was stored
    const session = await PhoneVerificationSession.findOne({
      phoneNumber: testPhone,
      used: false
    });
    expect(session).not.toBeNull();
  });

  test("7. Customer Registration: succeeds with verificationToken and prevents reuse", async () => {
    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-registration" });

    const verifyRes = await request(app)
      .post("/api/v1/auth/phone/verify-otp")
      .send({ phone: testPhone, otp: sendRes.body.data.devOtp, purpose: "customer-registration" });

    const token = verifyRes.body.data.verificationToken;

    // Register customer
    const regRes = await request(app)
      .post("/api/v1/auth/customer/register")
      .send({
        name: "Ramesh Patil",
        email: "ramesh@example.com",
        phone: testPhone,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        terms: true,
        verificationToken: token
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.phoneVerified).toBe(true);
    expect(regRes.body.data.accessToken).toBeDefined();

    // Verify token cannot be reused (single-use protection)
    const reuseRes = await request(app)
      .post("/api/v1/auth/customer/register")
      .send({
        name: "Second User",
        email: "second@example.com",
        phone: testPhone,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        terms: true,
        verificationToken: token
      });

    expect(reuseRes.status).toBe(400);
  });

  test("8. Customer Login with OTP: authenticates existing customer without password", async () => {
    // Seed verified customer
    await User.create({
      name: "OTP Customer",
      email: "otp.customer@example.com",
      phone: testPhone,
      phoneNumber: testPhone,
      normalizedPhoneNumber: `+91${testPhone}`,
      role: "customer",
      phoneVerified: true,
      approvalStatus: "approved"
    });

    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: testPhone, purpose: "customer-login", role: "customer" });

    const loginRes = await request(app)
      .post("/api/v1/auth/phone/login-with-otp")
      .send({
        phone: testPhone,
        otp: sendRes.body.data.devOtp,
        role: "customer"
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.name).toBe("OTP Customer");
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  test("9. Provider Login with OTP: blocks pending provider with explicit review message", async () => {
    const providerPhone = "9876543211";
    await User.create({
      name: "Pending Provider",
      email: "provider@example.com",
      phone: providerPhone,
      phoneNumber: providerPhone,
      normalizedPhoneNumber: `+91${providerPhone}`,
      role: "provider",
      phoneVerified: true,
      approvalStatus: "pending"
    });

    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: providerPhone, purpose: "provider-login", role: "provider" });

    const loginRes = await request(app)
      .post("/api/v1/auth/phone/login-with-otp")
      .send({
        phone: providerPhone,
        otp: sendRes.body.data.devOtp,
        role: "provider"
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.message).toBe("Your registration is under review. Please wait for admin approval.");
  });

  test("10. Driver Login with OTP: blocks pending driver with explicit review message", async () => {
    const driverPhone = "9876543212";
    await User.create({
      name: "Pending Driver",
      email: "driver@example.com",
      phone: driverPhone,
      phoneNumber: driverPhone,
      normalizedPhoneNumber: `+91${driverPhone}`,
      role: "driver",
      phoneVerified: true,
      approvalStatus: "pending"
    });

    const sendRes = await request(app)
      .post("/api/v1/auth/phone/send-otp")
      .send({ phone: driverPhone, purpose: "driver-login", role: "driver" });

    const loginRes = await request(app)
      .post("/api/v1/auth/phone/login-with-otp")
      .send({
        phone: driverPhone,
        otp: sendRes.body.data.devOtp,
        role: "driver"
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.message).toBe("Your driver registration is under review. Please wait for admin approval.");
  });
});
