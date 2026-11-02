const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../src/models/User");
const ServiceProvider = require("../src/models/ServiceProvider");
const ProviderApplication = require("../src/models/ProviderApplication");
const EmailOtp = require("../src/models/EmailOtp");


jest.mock("../src/config/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options, callback) => ({
        end: () => callback(null, {
          secure_url: "https://images.example.test/provider-photo.jpg",
          public_id: `test-upload-${Math.random().toString(36).slice(2)}`
        })
      })
    }
  },
  cloudinaryConfigured: true
}));

jest.setTimeout(120000);

let mongoServer;
let app;

const registrationFields = {
  fullName: "Provider Test",
  dob: "1990-01-01",
  phone: "9876543210",
  email: "provider@example.com",
  password: "secure-password-123",
  address: "123 Market Street",
  city: "Any New Town",
  taluk: "Any Taluk",
  district: "Any District",
  category: "Plumber",
  experience: "5 years",
  area: "Central Bagalkot",
  description: "Experienced plumbing services for homes.",
  consent: "false",
  terms: "true"
};

function registerProvider(fields = registrationFields) {
  const req = request(app).post("/api/v1/providers/register");
  for (const [key, value] of Object.entries(fields)) req.field(key, value);
  req.attach("profileImage", Buffer.from("fake-image-bytes"), { filename: "profile.jpg", contentType: "image/jpeg" });
  if (["Auto", "Passenger car", "Goods van"].includes(fields.category)) req.attach("vehicleImages", Buffer.from("fake-vehicle-bytes"), { filename: "vehicle.jpg", contentType: "image/jpeg" });
  return req;
}

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require("../src/app");
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    ServiceProvider.deleteMany({}),
    ProviderApplication.deleteMany({}),
    EmailOtp.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("service provider registration and authentication", () => {
  test("registers without OTP or email verification and can access provider profile", async () => {
    const registration = await registerProvider();

    expect(registration.status).toBe(201);
    expect(registration.body.data.user.role).toBe("provider");
    expect(registration.body.data.accessToken).toBeTruthy();
    expect(await User.countDocuments({ email: registrationFields.email })).toBe(1);
    expect(await ServiceProvider.countDocuments()).toBe(1);
    expect(await ProviderApplication.countDocuments({ status: "pending" })).toBe(1);

    const storedUser = await User.findOne({ email: registrationFields.email }).select("+password");
    expect(storedUser.password).not.toBe(registrationFields.password);

    const profile = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${registration.body.data.accessToken}`);

    expect(profile.status).toBe(200);
    expect(profile.body.data.verificationStatus).toBe("pending");
  });

  test("returns a conflict for a duplicate email", async () => {
    const first = await registerProvider();
    expect(first.status).toBe(201);

    const duplicate = await registerProvider();
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/already registered/i);
  });

  test("rejects invalid provider fields without creating an account", async () => {
    const invalid = await registerProvider({
      ...registrationFields,
      email: "not-an-email"
    });

    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toMatch(/required provider application fields/i);
    expect(await User.countDocuments()).toBe(0);
  });

  test("accepts free-form city, taluk and district values", async () => {
    const registration = await registerProvider({ ...registrationFields, city: "A small town not in a predefined list" });
    expect(registration.status).toBe(201);
    const application = await ProviderApplication.findOne({ email: registrationFields.email });
    expect(application.city).toBe("A small town not in a predefined list");
    expect(application.taluk).toBe(registrationFields.taluk);
    expect(application.district).toBe(registrationFields.district);
    expect(application.profileImage.url).toContain("https://");
  });

  test("requires vehicle photos for driver categories", async () => {
    const req = request(app).post("/api/v1/providers/register");
    for (const [key, value] of Object.entries({ ...registrationFields, category: "Auto" })) req.field(key, value);
    req.attach("profileImage", Buffer.from("fake-image-bytes"), { filename: "profile.jpg", contentType: "image/jpeg" });
    const response = await req;
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/vehicle photo is required/i);
  });

  test("supports password login and rejects invalid credentials", async () => {
    await registerProvider();

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: registrationFields.email, password: registrationFields.password });

    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe("provider");
    expect(login.body.data.accessToken).toBeTruthy();

    const invalidLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: registrationFields.email, password: "incorrect-password" });

    expect(invalidLogin.status).toBe(401);
  });

  test("rejects unauthenticated and wrong-role access to provider profile", async () => {
    const unauthenticated = await request(app).get("/api/v1/providers/me");
    expect(unauthenticated.status).toBe(401);

    const customer = await User.create({
      name: "Customer Test",
      email: "customer@example.com",
      phone: "9123456789",
      password: "hashed-password",
      role: "customer",
      location: "Bagalkot"
    });
    const jwt = require("jsonwebtoken");
    const customerToken = jwt.sign(
      { sub: customer.id, role: customer.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "5m" }
    );

    const forbidden = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(forbidden.status).toBe(403);
  });

  test("registers customer directly without requiring email OTP", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Customer Test",
        email: "customer@example.com",
        phone: "9123456789",
        password: "secure-password-123",
        location: "Bagalkot"
      });

    expect(registration.status).toBe(201);
    expect(registration.body.data.user.role).toBe("customer");
    expect(registration.body.data.accessToken).toBeTruthy();
    expect(await User.countDocuments({ email: "customer@example.com" })).toBe(1);
  });

  test("registration OTP endpoint rejects provider-purpose requests", async () => {
    const response = await request(app)
      .post("/api/v1/auth/send-otp")
      .send({
        email: registrationFields.email,
        purpose: "provider-registration"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid registration purpose.");
    expect(await EmailOtp.countDocuments()).toBe(0);
  });
});
