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
const TransportMessage = require("../src/models/TransportMessage");
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
    url: (publicId) => `https://res.cloudinary.com/mock/private/${publicId}`
  },
  cloudinaryConfigured: true
}));

jest.setTimeout(180000);

let mongoServer;
let app;
const JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters";
const JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";

function makeToken(user) {
  return jwt.sign(
    { sub: user._id ? user._id.toString() : user.id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
  process.env.JWT_ACCESS_EXPIRES_IN = "1h";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = require("../src/app");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Mandatory 20 End-to-End Production Acceptance Scenarios", () => {
  let customerUser, customerToken;
  let providerUser, providerToken, providerApp;
  let driverUser, driverToken, driverApp;
  let studentUser, studentToken, studentApp;
  let adminUser, adminToken;
  let testServiceBookingId;
  let testTransportBookingId;
  let testPropertyId;

  // Setup initial admin for approval scenarios
  beforeAll(async () => {
    const hashed = await bcrypt.hash("AdminPass123!", 10);
    adminUser = await User.create({
      name: "Super Admin",
      email: "super.admin@nukrentserve.com",
      password: hashed,
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot",
      isActive: true
    });
    adminToken = makeToken(adminUser);
  });

  // 1. New customer registration
  test("Scenario 1: New customer registration succeeds with clean credentials and defaults", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/customer")
      .send({
        name: "Ravi Kumar",
        email: "ravi.kumar@example.com",
        phone: "9876543210",
        password: "CustomerPass123!",
        location: "Bagalkot",
        terms: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.accessToken).toBeTruthy();

    customerUser = await User.findOne({ email: "ravi.kumar@example.com" });
    expect(customerUser).toBeTruthy();
    expect(customerUser.approvalStatus).toBe("approved");
    customerToken = res.body.data.accessToken;
  });

  // 2. Customer login
  test("Scenario 2: Customer login returns valid session and JWT token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "ravi.kumar@example.com",
        password: "CustomerPass123!"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe("ravi.kumar@example.com");

    customerToken = res.body.data.accessToken;
  });

  // 3. Customer Google login validation
  test("Scenario 3: Google login rejects unconfigured or forged credential token safely", async () => {
    const res = await request(app)
      .post("/api/v1/auth/google")
      .send({ credential: "invalid-forged-token-xyz" });

    // Should reject invalid google token safely with 401 or 500
    expect([401, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // 9. Provider document upload & registration
  test("Scenario 9: Provider registers with document upload into pending state", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/provider")
      .field("fullName", "Basavaraj Electrician")
      .field("dob", "1990-01-01")
      .field("email", "basavaraj.elec@example.com")
      .field("phone", "9845012345")
      .field("password", "ProviderPass123!")
      .field("address", "Sector 10, Navanagar")
      .field("city", "Bagalkot")
      .field("taluk", "Bagalkot")
      .field("district", "Bagalkot")
      .field("category", "Electrician")
      .field("experience", "6 years")
      .field("price", "₹300 / visit")
      .field("description", "Master electrician in Navanagar")
      .field("consent", "true")
      .field("terms", "true")
      .attach("profileImage", Buffer.from("dummy-photo"), { filename: "profile.jpg", contentType: "image/jpeg" })
      .attach("aadhaarDocument", Buffer.from("dummy-aadhaar-content"), { filename: "aadhaar.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("provider");

    providerUser = await User.findOne({ email: "basavaraj.elec@example.com" });
    expect(providerUser).toBeTruthy();
    expect(providerUser.approvalStatus).toBe("pending");

    providerApp = await ProviderApplication.findOne({ email: "basavaraj.elec@example.com" });
    expect(providerApp).toBeTruthy();
    expect(providerApp.status).toBe("pending");

    providerToken = res.body.data.accessToken;
  });

  // 10. Admin document review
  test("Scenario 10: Admin reviews provider applications and views document stream", async () => {
    const listRes = await request(app)
      .get("/api/v1/admin/applications?type=provider")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    const found = listRes.body.data.find(a => a.email === "basavaraj.elec@example.com");
    expect(found).toBeTruthy();
    expect(found.hasAadhaar).toBe(true);

    // Stream document
    const docRes = await request(app)
      .get(`/api/v1/admin/applications/${providerApp._id}/document/aadhaar`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 302]).toContain(docRes.status);
  });

  // 11. Admin approval of provider
  test("Scenario 11: Admin approves provider application and syncs User approvalStatus", async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/applications/${providerApp._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        decision: "approve",
        reason: "All documents verified."
      });

    expect(res.status).toBe(200);

    const refreshedUser = await User.findById(providerUser._id);
    expect(refreshedUser.approvalStatus).toBe("approved");

    providerUser = refreshedUser;
    providerToken = makeToken(providerUser);
  });

  // 4. Customer service request
  test("Scenario 4: Customer submits service request matching approved provider", async () => {
    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingType: "service",
        category: "Electrician",
        location: "Bagalkot",
        message: "Fan regulator replacement and switchboard check",
        scheduledDate: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.category).toBe("Electrician");
    testServiceBookingId = res.body.data._id;
  });

  // 5. Provider receives request
  test("Scenario 5: Provider receives customer request in their incoming queue", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/received")
      .set("Authorization", `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const item = res.body.data.find(b => b._id.toString() === testServiceBookingId);
    expect(item).toBeTruthy();
    expect(item.status).toBe("pending");
  });

  // 6. Provider accepts request
  test("Scenario 6: Provider accepts request, changing status to accepted", async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${testServiceBookingId}/status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("accepted");
  });

  // 7. Customer receives confirmation
  test("Scenario 7: Customer checks booking history and verifies accepted status", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/mine")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    const confirmed = res.body.data.find(b => b._id.toString() === testServiceBookingId);
    expect(confirmed).toBeTruthy();
    expect(confirmed.status).toBe("accepted");
  });

  // 8. Customer-provider chat
  test("Scenario 8: Customer and Provider exchange in-trip messages", async () => {
    // Customer sends message
    const sendRes1 = await request(app)
      .post(`/api/v1/chat/${testServiceBookingId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ message: "Namaskara! Please bring a standard 5A switch." });

    expect(sendRes1.status).toBe(201);
    expect(sendRes1.body.data.message).toBe("Namaskara! Please bring a standard 5A switch.");

    // Provider sends reply
    const sendRes2 = await request(app)
      .post(`/api/v1/chat/${testServiceBookingId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ message: "Sure sir, I will arrive at 11 AM." });

    expect(sendRes2.status).toBe(201);

    // Both read conversation stream
    const readRes = await request(app)
      .get(`/api/v1/chat/${testServiceBookingId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.length).toBe(2);
  });

  // 8b. Direct Customer-to-Provider messaging (without prior booking)
  test("Scenario 8b: Direct Customer-to-Provider messaging, unread counts, and provider reply", async () => {
    // Customer initiates direct conversation with provider
    const initRes = await request(app)
      .post("/api/v1/chat/conversation")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ recipientId: providerUser._id });

    expect(initRes.status).toBe(200);
    const convId = initRes.body.data.id || initRes.body.data.conversationId;
    expect(convId).toBeTruthy();

    // Customer sends direct message
    const sendRes1 = await request(app)
      .post(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ message: "Hello! Are you available for a house wiring check today?" });

    expect(sendRes1.status).toBe(201);
    expect(sendRes1.body.data.message).toBe("Hello! Are you available for a house wiring check today?");

    // Provider gets conversations list and verifies unread badge
    const provConvsRes = await request(app)
      .get("/api/v1/chat/conversations")
      .set("Authorization", `Bearer ${providerToken}`);

    expect(provConvsRes.status).toBe(200);
    const directThread = provConvsRes.body.data.find(c => c.id === convId.toString());
    expect(directThread).toBeTruthy();
    expect(directThread.unread).toBe(1);

    // Provider reads conversation messages (which clears unread)
    const provReadRes = await request(app)
      .get(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`);

    expect(provReadRes.status).toBe(200);
    expect(provReadRes.body.data.length).toBe(1);

    // Provider replies to customer
    const sendRes2 = await request(app)
      .post(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ message: "Yes! I can visit your location by 4 PM." });

    expect(sendRes2.status).toBe(201);

    // Customer reads thread and sees both messages
    const custReadRes = await request(app)
      .get(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(custReadRes.status).toBe(200);
    expect(custReadRes.body.data.length).toBe(2);
    expect(custReadRes.body.data[1].message).toBe("Yes! I can visit your location by 4 PM.");
  });

  // 12. Driver registration and approval
  test("Scenario 12: Driver registration, DL & RC upload, and admin approval", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register/driver")
      .field("fullName", "Manjunath Auto Driver")
      .field("email", "manju.auto@example.com")
      .field("phone", "9845112233")
      .field("password", "DriverPass123!")
      .field("address", "Old Bus Stand Auto Stand")
      .field("city", "Bagalkot")
      .field("vehicleType", "auto")
      .field("vehicleRegistrationNumber", "KA 29 A 1234")
      .field("drivingLicenceNumber", "KA2920200001234")
      .field("terms", "true")
      .field("consent", "true")
      .attach("profileImage", Buffer.from("photo-content"), { filename: "profile.jpg", contentType: "image/jpeg" })
      .attach("drivingLicenceDocument", Buffer.from("dl-content"), { filename: "dl.pdf", contentType: "application/pdf" })
      .attach("vehicleRcDocument", Buffer.from("rc-content"), { filename: "rc.jpg", contentType: "image/jpeg" });

    expect(regRes.status).toBe(201);
    driverUser = await User.findOne({ email: "manju.auto@example.com" });
    driverApp = await ProviderApplication.findOne({ email: "manju.auto@example.com" });
    expect(driverUser.approvalStatus).toBe("pending");

    // Admin approves driver
    const appRes = await request(app)
      .patch(`/api/v1/admin/applications/${driverApp._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve", reason: "DL and vehicle verified." });

    expect(appRes.status).toBe(200);
    const refreshedDriver = await User.findById(driverUser._id);
    expect(refreshedDriver.approvalStatus).toBe("approved");

    driverUser = refreshedDriver;
    driverToken = makeToken(driverUser);
  });

  // 13. Driver transport booking
  test("Scenario 13: Customer creates Auto booking, Driver accepts via 30s dispatch", async () => {
    const createRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Old Bus Stand, Bagalkot",
        destination: "Navanagar Sector 10",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        details: "Single passenger with small luggage"
      });

    expect(createRes.status).toBe(201);
    testTransportBookingId = createRes.body.data._id;

    // Driver fetches available transport requests
    const availRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${driverToken}`);

    expect(availRes.status).toBe(200);

    // Driver accepts
    const acceptRes = await request(app)
      .patch(`/api/v1/transport-bookings/${testTransportBookingId}/status`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ status: "accepted" });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe("accepted");
  });

  // 14. GPS tracking
  test("Scenario 14: Driver broadcasts live location and Customer receives tracking updates", async () => {
    // Driver updates live trip location
    const updateRes = await request(app)
      .patch(`/api/v1/transport-bookings/${testTransportBookingId}/location`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({
        locationCoordinates: { latitude: 16.1824, longitude: 75.6987 },
        heading: 90,
        speed: 35,
        accuracy: 5
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.liveLocation.latitude).toBe(16.1824);

    // Customer polls tracking snapshot
    const trackRes = await request(app)
      .get(`/api/v1/transport-bookings/${testTransportBookingId}/tracking`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.liveLocation.latitude).toBe(16.1824);
    expect(trackRes.body.data.liveLocation.longitude).toBe(75.6987);
  });

  // 15. Student registration and verification
  test("Scenario 15: Student partner registration, ID verification and approval", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register/student")
      .field("fullName", "Kavita Student")
      .field("email", "kavita.student@example.com")
      .field("phone", "9876500000")
      .field("password", "StudentPass123!")
      .field("address", "Hostel Block B")
      .field("city", "Bagalkot")
      .field("collegeName", "BEC Bagalkot")
      .field("studentIdNumber", "2BA21CS099")
      .field("terms", "true")
      .field("consent", "true")
      .attach("studentIdCardDocument", Buffer.from("id-card-content"), { filename: "id.jpg", contentType: "image/jpeg" });

    expect(regRes.status).toBe(201);
    studentUser = await User.findOne({ email: "kavita.student@example.com" });
    studentApp = await ProviderApplication.findOne({ email: "kavita.student@example.com" });

    // Admin verifies student
    const approveRes = await request(app)
      .patch(`/api/v1/admin/applications/${studentApp._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve", reason: "Student ID verified with college." });

    expect(approveRes.status).toBe(200);
    const refreshedStudent = await User.findById(studentUser._id);
    expect(refreshedStudent.approvalStatus).toBe("approved");

    studentUser = refreshedStudent;
    studentToken = makeToken(studentUser);
  });

  // 16. Rental listing and booking
  test("Scenario 16: Property owner creates rental listing and Customer books it", async () => {
    // Register owner
    const ownerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Shivanand Owner",
        email: "shivanand.owner@example.com",
        phone: "9845998877",
        password: "OwnerPass123!",
        role: "owner",
        location: "Bagalkot"
      });

    expect(ownerRes.status).toBe(201);
    const ownerToken = ownerRes.body.data.accessToken;

    // Create property listing
    const propRes = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        type: "house",
        title: "Spacious 2 BHK Near BEC College",
        description: "24/7 water, bike parking, quiet neighborhood for students",
        rent: 8500,
        deposit: 25000,
        address: "Vidyagiri 5th Cross",
        location: "Bagalkot"
      });

    expect(propRes.status).toBe(201);
    testPropertyId = propRes.body.data.id || propRes.body.data._id;

    // Customer requests property booking
    const bookRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        propertyId: testPropertyId,
        bookingType: "property",
        requestedMoveInDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        message: "Hello sir, we are 2 students looking to move in next month."
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.propertyId).toBe(testPropertyId);
  });

  // 17. Logout and session invalidation
  test("Scenario 17: Logout invalidates refresh token; subsequent refresh rejected", async () => {
    // Login to get fresh tokens
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ravi.kumar@example.com", password: "CustomerPass123!" });

    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = loginRes.body.data;

    // Logout
    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(logoutRes.status).toBe(200);

    // Refreshing with revoked token must fail with 401
    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);

    // Customer can log back in successfully
    const reLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ravi.kumar@example.com", password: "CustomerPass123!" });

    expect(reLogin.status).toBe(200);
  });

  // 18. Cross-role access rejection
  test("Scenario 18: Customer cannot access Admin endpoints or Provider actions", async () => {
    // Customer calling admin stats
    const adminRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(adminRes.status).toBe(403);

    // Customer attempting to decide application
    const decideRes = await request(app)
      .patch(`/api/v1/admin/applications/${providerApp._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ decision: "approve" });

    expect(decideRes.status).toBe(403);
  });

  // 19. Unauthorized document access rejection (IDOR protection)
  test("Scenario 19: Unrelated user cannot access another user's private documents", async () => {
    // Customer attempts to view provider's Aadhaar document
    const res = await request(app)
      .get(`/api/v1/documents/${providerApp._id}/aadhaar`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/access denied/i);
  });

  // 20. Website and mobile app data synchronization check
  test("Scenario 20: Backend envelope format adheres to standard contract for Web and Mobile", async () => {
    const res = await request(app)
      .get("/api/v1/services")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("statusCode", 200);
    expect(res.body).toHaveProperty("data");
    expect(typeof res.body.data).toBe("object");
  });
});
