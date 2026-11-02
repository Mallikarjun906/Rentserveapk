const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const ServiceProvider = require("../src/models/ServiceProvider");
const ProviderApplication = require("../src/models/ProviderApplication");
const ServiceCategory = require("../src/models/ServiceCategory");
const ServiceListing = require("../src/models/ServiceListing");
const Property = require("../src/models/Property");
const Booking = require("../src/models/Booking");
const TransportBooking = require("../src/models/TransportBooking");
const AuditLog = require("../src/models/AuditLog");

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
    },
    utils: {
      private_download_url: (publicId) =>
        `https://res.cloudinary.com/mock/private/${publicId}`
    }
  },
  cloudinaryConfigured: true
}));

jest.setTimeout(120000);

let mongoServer;
let app;
const JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters";
const JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";

function makeToken(user) {
  return jwt.sign(
    { sub: user._id || user.id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require("../src/app");
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    ServiceProvider.deleteMany({}),
    ProviderApplication.deleteMany({}),
    ServiceCategory.deleteMany({}),
    ServiceListing.deleteMany({}),
    Property.deleteMany({}),
    Booking.deleteMany({}),
    TransportBooking.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("RBAC, Separate Registration & Admin Approval Security Suite", () => {
  test("1 & 2: A customer cannot access provider, driver or admin endpoints", async () => {
    const customer = await User.create({
      name: "Customer One",
      email: "cust@example.com",
      phone: "9876543210",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const token = makeToken(customer);

    // Try accessing provider me
    const provRes = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${token}`);
    expect(provRes.status).toBe(403);

    // Try accessing driver queue
    const driverRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${token}`);
    expect(driverRes.status).toBe(403);

    // Try accessing admin stats
    const adminRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(adminRes.status).toBe(403);
  });

  test("3: A provider cannot access the admin dashboard or admin endpoints", async () => {
    const provider = await User.create({
      name: "Provider One",
      email: "provider@example.com",
      phone: "9876543211",
      role: "provider",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const token = makeToken(provider);

    const res = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);

    const auditRes = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`);
    expect(auditRes.status).toBe(403);
  });

  test("4 & 5: Driver cannot access student/admin endpoints and student cannot access provider/admin endpoints", async () => {
    const driver = await User.create({
      name: "Driver One",
      email: "driver@example.com",
      phone: "9876543212",
      role: "driver",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const student = await User.create({
      name: "Student One",
      email: "student@example.com",
      phone: "9876543213",
      role: "student",
      approvalStatus: "approved",
      location: "Bagalkot"
    });

    const driverToken = makeToken(driver);
    const studentToken = makeToken(student);

    // Driver cannot access admin
    const dAdmin = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${driverToken}`);
    expect(dAdmin.status).toBe(403);

    // Student cannot access provider endpoint
    const sProv = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(sProv.status).toBe(403);

    // Student cannot access driver queues
    const sDriver = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(sDriver.status).toBe(403);
  });

  test("6: A user cannot change their role or approvalStatus using API requests", async () => {
    const customer = await User.create({
      name: "Smart Attacker",
      email: "attacker@example.com",
      phone: "9876543214",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const token = makeToken(customer);

    // Attempt to escalate role to admin
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name", role: "admin", approvalStatus: "approved" });

    expect(res.status).toBe(200);

    const refreshed = await User.findById(customer._id);
    expect(refreshed.name).toBe("Updated Name");
    expect(refreshed.role).toBe("customer");
  });

  test("7: An unapproved provider cannot publish services or accept bookings", async () => {
    const unapprovedProvider = await User.create({
      name: "Pending Plumber",
      email: "pendingplumber@example.com",
      phone: "9876543215",
      role: "provider",
      approvalStatus: "pending",
      location: "Bagalkot"
    });
    await ServiceProvider.create({
      userId: unapprovedProvider._id,
      displayName: "Pending Plumber",
      verificationStatus: "pending"
    });
    const token = makeToken(unapprovedProvider);

    const category = await ServiceCategory.create({
      name: "Plumbing",
      slug: "plumbing",
      isActive: true
    });

    // Attempt to publish a service listing
    const createListing = await request(app)
      .post("/api/v1/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        categoryId: category._id.toString(),
        title: "Expert Plumbing",
        description: "Emergency plumbing repair",
        location: "Bagalkot",
        priceRange: JSON.stringify({ min: 200, max: 500 }),
        status: "published"
      });

    expect(createListing.status).toBe(403);
    expect(createListing.body.message).toMatch(/unapproved providers cannot publish/i);

    // Attempt to accept a booking request
    const customer = await User.create({
      name: "Normal Customer",
      email: "nc@example.com",
      phone: "9876543216",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const property = await Property.create({
      ownerId: unapprovedProvider._id,
      title: "Sample Shop",
      type: "shop",
      rent: 4000,
      address: "Main Rd",
      location: "Bagalkot",
      status: "published",
      availability: true
    });
    const booking = await Booking.create({
      customerId: customer._id,
      ownerId: unapprovedProvider._id,
      propertyId: property._id,
      status: "pending"
    });

    const acceptRes = await request(app)
      .patch(`/api/v1/bookings/${booking._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    expect(acceptRes.status).toBe(403);
    expect(acceptRes.body.message).toMatch(/unapproved providers cannot accept bookings/i);
  });

  test("8: An unapproved driver cannot accept transport bookings or start GPS tracking", async () => {
    const unapprovedDriver = await User.create({
      name: "Pending Driver",
      email: "pendingdriver@example.com",
      phone: "9876543217",
      role: "driver",
      approvalStatus: "pending",
      location: "Bagalkot"
    });
    const token = makeToken(unapprovedDriver);

    // Attempt to start GPS tracking / update location
    const locRes = await request(app)
      .patch("/api/v1/transport-bookings/location")
      .set("Authorization", `Bearer ${token}`)
      .send({ locationCoordinates: { latitude: 16.18, longitude: 75.69 } });

    expect(locRes.status).toBe(403);
    expect(locRes.body.message).toMatch(/pending administrator review/i);

    // Attempt to accept a ride booking
    const customer = await User.create({
      name: "Rider",
      email: "rider@example.com",
      phone: "9876543218",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const trip = await TransportBooking.create({
      customerId: customer._id,
      vehicleType: "auto",
      pickup: "Bagalkot Station",
      destination: "Vidyagiri",
      scheduledAt: new Date(),
      status: "pending"
    });

    const acceptTrip = await request(app)
      .patch(`/api/v1/transport-bookings/${trip._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    expect(acceptTrip.status).toBe(403);
  });

  test("9: Admin can review documents, approve or reject registrations with reason, and audit logs are recorded", async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      phone: "9999999999",
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    const adminToken = makeToken(admin);

    const applicant = await User.create({
      name: "Driver To Review",
      email: "driverreview@example.com",
      phone: "9876543219",
      role: "driver",
      approvalStatus: "pending",
      location: "Bagalkot"
    });

    const appRecord = await ProviderApplication.create({
      userId: applicant._id,
      applicationType: "driver",
      fullName: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      city: "Bagalkot",
      drivingLicenceNumber: "KA2920260012345",
      drivingLicenceDocument: {
        publicId: "local-dl-doc-1.jpg",
        resourceType: "image",
        mimeType: "image/jpeg"
      },
      status: "pending"
    });

    // 1. Admin rejects with reason
    const rejectRes = await request(app)
      .patch(`/api/v1/admin/applications/${appRecord._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "reject", reason: "Driving licence photo is blurry. Please re-upload a clear copy." });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe("rejected");

    const refreshedUser = await User.findById(applicant._id);
    expect(refreshedUser.approvalStatus).toBe("rejected");
    expect(refreshedUser.rejectionReason).toMatch(/blurry/i);

    // Audit log was recorded
    const logs = await AuditLog.find({ action: "APPLICATION_REJECTED" });
    expect(logs.length).toBe(1);
    expect(logs[0].targetUserEmail).toBe("driverreview@example.com");

    // 2. Admin approves after review
    const approveRes = await request(app)
      .patch(`/api/v1/admin/applications/${appRecord._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve", reason: "All documents verified." });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe("approved");

    const approvedUser = await User.findById(applicant._id);
    expect(approvedUser.approvalStatus).toBe("approved");
  });

  test("10: A rejected user can upload replacement documents, resetting status to pending", async () => {
    const rejectedUser = await User.create({
      name: "Rejected Driver",
      email: "rejected@example.com",
      phone: "9876543220",
      role: "driver",
      approvalStatus: "rejected",
      rejectionReason: "Document unclear",
      location: "Bagalkot"
    });
    const token = makeToken(rejectedUser);

    await ProviderApplication.create({
      userId: rejectedUser._id,
      applicationType: "driver",
      fullName: rejectedUser.name,
      email: rejectedUser.email,
      phone: rejectedUser.phone,
      city: "Bagalkot",
      status: "rejected",
      rejectionReason: "Document unclear"
    });

    // User resubmits documents
    const resubmitRes = await request(app)
      .post("/api/v1/documents/resubmit")
      .set("Authorization", `Bearer ${token}`)
      .attach("drivingLicenceDocument", Buffer.from("mock-new-dl-bytes"), {
        filename: "new-dl.jpg",
        contentType: "image/jpeg"
      });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.data.status).toBe("pending");

    const updatedUser = await User.findById(rejectedUser._id);
    expect(updatedUser.approvalStatus).toBe("pending");
    expect(updatedUser.rejectionReason).toBe("");

    const updatedApp = await ProviderApplication.findOne({ userId: rejectedUser._id });
    expect(updatedApp.status).toBe("pending");
    expect(updatedApp.resubmittedAt).toBeTruthy();
  });

  test("11: Private documents cannot be accessed through public URLs or unauthorized users", async () => {
    const owner = await User.create({
      name: "Document Owner",
      email: "docowner@example.com",
      phone: "9876543221",
      role: "provider",
      approvalStatus: "pending",
      location: "Bagalkot"
    });
    const otherUser = await User.create({
      name: "Snooper",
      email: "snooper@example.com",
      phone: "9876543222",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });

    const appRecord = await ProviderApplication.create({
      userId: owner._id,
      applicationType: "provider",
      fullName: owner.name,
      email: owner.email,
      phone: owner.phone,
      city: "Bagalkot",
      aadhaarDocument: {
        publicId: "local-test-doc-99.jpg",
        resourceType: "image",
        mimeType: "image/jpeg"
      },
      status: "pending"
    });

    // 1. Unauthenticated request to private document -> 401
    const unauth = await request(app).get(`/api/v1/documents/${appRecord._id}/aadhaarDocument`);
    expect(unauth.status).toBe(401);

    // 2. Another user trying to access -> 403 Forbidden
    const otherToken = makeToken(otherUser);
    const forbidden = await request(app)
      .get(`/api/v1/documents/${appRecord._id}/aadhaarDocument`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.message).toMatch(/access denied/i);
  });

  test("12: Dedicated Admin Login enforces admin role, and customer cannot log in as admin", async () => {
    const passwordHash = await bcrypt.hash("AdminPass123!", 12);
    const adminUser = await User.create({
      name: "Platform Administrator",
      email: "superadmin@example.com",
      phone: "9998887776",
      password: passwordHash,
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot"
    });

    const customerUser = await User.create({
      name: "Regular Customer",
      email: "regcustomer@example.com",
      phone: "9998887775",
      password: passwordHash,
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot"
    });

    // Customer attempts to sign in via /admin/login
    const custAdminLogin = await request(app)
      .post("/api/v1/admin/login")
      .send({ email: "regcustomer@example.com", password: "AdminPass123!" });

    expect(custAdminLogin.status).toBe(403);
    expect(custAdminLogin.body.message).toMatch(/only system administrators/i);

    // Valid admin logs in
    const validAdminLogin = await request(app)
      .post("/api/v1/admin/login")
      .send({ email: "superadmin@example.com", password: "AdminPass123!" });

    expect(validAdminLogin.status).toBe(200);
    expect(validAdminLogin.body.data.user.role).toBe("admin");
    expect(validAdminLogin.body.data.accessToken).toBeTruthy();
  });

  test("13: Separate Registration endpoints: Customer, Driver and Student", async () => {
    // A. Customer Registration
    const custReg = await request(app)
      .post("/api/v1/auth/register/customer")
      .send({
        name: "Akash Patil",
        email: "akash@example.com",
        phone: "9876543230",
        password: "secure-password-123",
        confirmPassword: "secure-password-123",
        address: "Station Road, Bagalkot",
        city: "Bagalkot",
        terms: true
      });

    expect(custReg.status).toBe(201);
    expect(custReg.body.data.user.role).toBe("customer");
    expect(custReg.body.data.user.approvalStatus).toBe("approved");

    // B. Driver Registration with DL and profile photo
    const driverReg = await request(app)
      .post("/api/v1/auth/register/driver")
      .field("fullName", "Ramesh Driver")
      .field("email", "ramesh.driver@example.com")
      .field("phone", "9876543231")
      .field("password", "secure-password-123")
      .field("address", "Sector 10, Navanagar")
      .field("city", "Bagalkot")
      .field("drivingLicenceNumber", "KA2920261122334")
      .field("vehicleType", "auto")
      .field("vehicleRegistrationNumber", "KA 29 B 5500")
      .field("terms", "true")
      .field("consent", "true")
      .attach("profileImage", Buffer.from("fake-profile-photo"), {
        filename: "driver-photo.jpg",
        contentType: "image/jpeg"
      })
      .attach("drivingLicenceDocument", Buffer.from("fake-dl-document"), {
        filename: "dl.pdf",
        contentType: "application/pdf"
      });

    expect(driverReg.status).toBe(201);
    expect(driverReg.body.data.user.role).toBe("driver");
    expect(driverReg.body.data.user.approvalStatus).toBe("pending");

    // C. Student Registration with College and ID Card
    const studentReg = await request(app)
      .post("/api/v1/auth/register/student")
      .field("fullName", "Sneha Kulkarni")
      .field("email", "sneha.student@example.com")
      .field("phone", "9876543232")
      .field("password", "secure-password-123")
      .field("collegeName", "BEC Bagalkot")
      .field("studentIdNumber", "2BA23CS045")
      .field("address", "Vidyagiri, Bagalkot")
      .field("city", "Bagalkot")
      .field("terms", "true")
      .field("consent", "true")
      .attach("studentIdCardDocument", Buffer.from("fake-student-id"), {
        filename: "idcard.png",
        contentType: "image/png"
      });

    expect(studentReg.status).toBe(201);
    expect(studentReg.body.data.user.role).toBe("student");
    expect(studentReg.body.data.user.approvalStatus).toBe("pending");
  });
});
