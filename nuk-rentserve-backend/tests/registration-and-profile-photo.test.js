const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../src/models/User");
const ServiceProvider = require("../src/models/ServiceProvider");
const ProviderApplication = require("../src/models/ProviderApplication");

jest.mock("../src/config/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options, callback) => ({
        end: () =>
          callback(null, {
            secure_url: "https://res.cloudinary.com/demo/image/upload/sample-profile.jpg",
            public_id: `test-profile-${Math.random().toString(36).slice(2)}`
          })
      })
    }
  },
  cloudinaryConfigured: true
}));

jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require("../src/app");
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await ServiceProvider.deleteMany({});
  await ProviderApplication.deleteMany({});
});

describe("Complete Registration & Profile Photo Integration Tests", () => {
  test("1. Customer Registration with profile photo and direct login", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/customer")
      .field("name", "Ramesh Patil")
      .field("email", "ramesh@example.com")
      .field("phone", "9876543210")
      .field("password", "customerpass123")
      .field("confirmPassword", "customerpass123")
      .field("city", "Bagalkot")
      .field("terms", "true")
      .attach("profileImage", Buffer.from("fake-jpg-bytes"), {
        filename: "avatar.jpg",
        contentType: "image/jpeg"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.accessToken).toBeDefined();

    const savedUser = await User.findOne({ email: "ramesh@example.com" });
    expect(savedUser).not.toBeNull();
    expect(savedUser.profileImage.url).toContain("cloudinary.com");
  });

  test("2. Service Provider Registration with photo and Aadhaar document", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/provider")
      .field("fullName", "Suresh Electrician")
      .field("email", "suresh@example.com")
      .field("phone", "9876543211")
      .field("password", "providerpass123")
      .field("city", "Bagalkot")
      .field("category", "Electrician")
      .field("experience", "4 years")
      .field("description", "Complete residential and commercial electrical wiring")
      .field("terms", "true")
      .field("consent", "true")
      .attach("profileImage", Buffer.from("fake-profile-bytes"), {
        filename: "suresh.jpg",
        contentType: "image/jpeg"
      })
      .attach("aadhaarDocument", Buffer.from("fake-aadhaar-bytes"), {
        filename: "aadhaar.jpg",
        contentType: "image/jpeg"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("provider");
    expect(res.body.data.user.approvalStatus).toBe("pending");

    const savedProvider = await ServiceProvider.findOne({ displayName: "Suresh Electrician" });
    expect(savedProvider).not.toBeNull();
    expect(savedProvider.profileImage.url).toContain("cloudinary.com");

    const appRecord = await ProviderApplication.findOne({ email: "suresh@example.com" });
    expect(appRecord).not.toBeNull();
    expect(appRecord.status).toBe("pending");
  });

  test("3. Driver Partner Registration (Auto) with DL and Profile Photo", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/driver")
      .field("fullName", "Basavaraj Auto")
      .field("email", "basavaraj@example.com")
      .field("phone", "9876543212")
      .field("password", "driverpass123")
      .field("city", "Bagalkot")
      .field("address", "Sector 10 Vidyagiri")
      .field("vehicleType", "auto")
      .field("vehicleRegistrationNumber", "KA 29 B 1234")
      .field("drivingLicenceNumber", "KA2920200012345")
      .field("terms", "true")
      .field("consent", "true")
      .attach("profileImage", Buffer.from("fake-driver-photo"), {
        filename: "driver.jpg",
        contentType: "image/jpeg"
      })
      .attach("drivingLicenceDocument", Buffer.from("fake-dl-bytes"), {
        filename: "dl.jpg",
        contentType: "image/jpeg"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("driver");
    expect(res.body.data.applicationStatus).toBe("pending");

    const savedUser = await User.findOne({ email: "basavaraj@example.com" });
    expect(savedUser.profileImage.url).toContain("cloudinary.com");
  });

  test("4. Student Partner Registration with Student ID document", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/student")
      .field("fullName", "Ananya Student")
      .field("email", "ananya@bec.edu")
      .field("phone", "9876543213")
      .field("password", "studentpass123")
      .field("city", "Bagalkot")
      .field("collegeName", "Basaveshwar Engineering College")
      .field("studentIdNumber", "2BA21CS045")
      .field("terms", "true")
      .field("consent", "true")
      .attach("profileImage", Buffer.from("fake-student-photo"), {
        filename: "student.jpg",
        contentType: "image/jpeg"
      })
      .attach("studentIdCardDocument", Buffer.from("fake-id-card"), {
        filename: "idcard.jpg",
        contentType: "image/jpeg"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("student");

    const appRecord = await ProviderApplication.findOne({ email: "ananya@bec.edu" });
    expect(appRecord).not.toBeNull();
    expect(appRecord.collegeName).toBe("Basaveshwar Engineering College");
  });

  test("5. Property Owner Registration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/owner")
      .field("name", "Anand Owner")
      .field("email", "anand@example.com")
      .field("phone", "9876543214")
      .field("password", "ownerpass123")
      .field("city", "Bagalkot")
      .field("terms", "true")
      .attach("profileImage", Buffer.from("fake-owner-photo"), {
        filename: "owner.jpg",
        contentType: "image/jpeg"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("owner");
    expect(res.body.data.user.approvalStatus).toBe("approved");

    const savedUser = await User.findOne({ email: "anand@example.com" });
    expect(savedUser.profileImage.url).toContain("cloudinary.com");
  });

  test("6. Update profile photo via POST /api/v1/users/me/photo", async () => {
    // First register a customer
    const reg = await request(app)
      .post("/api/v1/auth/register/customer")
      .send({
        name: "Test User",
        email: "testuser@example.com",
        phone: "9876543215",
        password: "testuserpass123",
        city: "Bagalkot",
        terms: true
      });

    const token = reg.body.data.accessToken;

    const photoRes = await request(app)
      .post("/api/v1/users/me/photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profileImage", Buffer.from("new-photo-bytes"), {
        filename: "new-profile.jpg",
        contentType: "image/jpeg"
      });

    expect(photoRes.status).toBe(200);
    expect(photoRes.body.success).toBe(true);
    expect(photoRes.body.data.profileImage.url).toContain("cloudinary.com");

    const getMeRes = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(getMeRes.status).toBe(200);
    expect(getMeRes.body.data.profileImage.url).toContain("cloudinary.com");
  });

  test("7. Validations: duplicate email returns 409", async () => {
    await request(app)
      .post("/api/v1/auth/register/customer")
      .send({
        name: "First User",
        email: "dup@example.com",
        phone: "9876543216",
        password: "password123",
        city: "Bagalkot",
        terms: true
      });

    const dup = await request(app)
      .post("/api/v1/auth/register/customer")
      .send({
        name: "Second User",
        email: "dup@example.com",
        phone: "9876543217",
        password: "password123",
        city: "Bagalkot",
        terms: true
      });

    expect(dup.status).toBe(409);
    expect(dup.body.message).toMatch(/already registered/i);
  });
});
