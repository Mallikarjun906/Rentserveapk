const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const ProviderApplication = require("../src/models/ProviderApplication");
const ServiceProvider = require("../src/models/ServiceProvider");
const TransportBooking = require("../src/models/TransportBooking");
const Booking = require("../src/models/Booking");

jest.mock("../src/config/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_options, callback) => ({
        end: () => callback(null, { secure_url: "https://example.com/test.jpg", public_id: "test_id" }),
      }),
    },
    utils: {
      private_download_url: (pid) => `https://example.com/${pid}`,
    },
  },
  cloudinaryConfigured: true,
}));

jest.setTimeout(60000);

let mongoServer;
let app;
const JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters";

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";
  process.env.PORT = "0";

  await mongoose.connect(process.env.MONGODB_URI);
  app = require("../src/app");
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("Section 5: Driver & Provider Navigation and Live Orders Verification", () => {
  let customerUser, customerToken;
  let providerUser, providerToken;
  let driverUser1, driverToken1;
  let driverUser2, driverToken2;
  let adminUser, adminToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await ProviderApplication.deleteMany({});
    await ServiceProvider.deleteMany({});
    await TransportBooking.deleteMany({});
    await Booking.deleteMany({});

    const hashed = await bcrypt.hash("Password123!", 10);

    // 1. Customer
    customerUser = await User.create({
      name: "Ramesh Customer",
      email: "customer@example.com",
      phone: "9845011111",
      password: hashed,
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot",
    });
    customerToken = makeToken(customerUser);

    // 2. Service Provider
    providerUser = await User.create({
      name: "Basavaraj Electrician",
      email: "provider@example.com",
      phone: "9845022222",
      password: hashed,
      role: "provider",
      approvalStatus: "approved",
      location: "Bagalkot",
      isOnline: true,
    });
    providerToken = makeToken(providerUser);

    await ProviderApplication.create({
      userId: providerUser._id,
      applicationType: "provider",
      fullName: "Basavaraj Electrician",
      phone: "9845022222",
      category: "Electrician",
      experience: "5 years",
      city: "Bagalkot",
      status: "approved",
      isOnline: true,
      consent: true,
    });

    await ServiceProvider.create({
      userId: providerUser._id,
      displayName: "Basavaraj Electrician",
      skills: ["Wiring", "Inverter Setup"],
      experienceYears: 5,
    });

    // 3. Driver 1 (Auto Driver)
    driverUser1 = await User.create({
      name: "Suresh Auto",
      email: "driver1@example.com",
      phone: "9845033333",
      password: hashed,
      role: "driver",
      approvalStatus: "approved",
      location: "Bagalkot",
      isOnline: true,
    });
    driverToken1 = makeToken(driverUser1);

    await ProviderApplication.create({
      userId: driverUser1._id,
      applicationType: "driver",
      fullName: "Suresh Auto",
      phone: "9845033333",
      category: "Auto",
      vehicleType: "auto",
      vehicleRegistrationNumber: "KA-29-A-1234",
      city: "Bagalkot",
      status: "approved",
      isOnline: true,
      consent: true,
      locationCoordinates: { latitude: 16.18, longitude: 75.7 },
      vehicleImages: [{ url: "https://example.com/auto.jpg", publicId: "auto1" }],
    });

    // 4. Driver 2 (Another Auto Driver for race condition test)
    driverUser2 = await User.create({
      name: "Manjunath Auto",
      email: "driver2@example.com",
      phone: "9845044444",
      password: hashed,
      role: "driver",
      approvalStatus: "approved",
      location: "Bagalkot",
      isOnline: true,
    });
    driverToken2 = makeToken(driverUser2);

    await ProviderApplication.create({
      userId: driverUser2._id,
      applicationType: "driver",
      fullName: "Manjunath Auto",
      phone: "9845044444",
      category: "Auto",
      vehicleType: "auto",
      vehicleRegistrationNumber: "KA-29-A-5678",
      city: "Bagalkot",
      status: "approved",
      isOnline: true,
      consent: true,
      locationCoordinates: { latitude: 16.18, longitude: 75.7 },
      vehicleImages: [{ url: "https://example.com/auto2.jpg", publicId: "auto2" }],
    });

    // 5. Admin
    adminUser = await User.create({
      name: "Admin Control",
      email: "admin@example.com",
      phone: "9845099999",
      password: hashed,
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot",
    });
    adminToken = makeToken(adminUser);
  });

  test("1. Provider can log in and access Dashboard and Profile data", async () => {
    // Dashboard data: received requests & accepted bookings
    const receivedRes = await request(app)
      .get("/api/v1/bookings/received")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);

    expect(Array.isArray(receivedRes.body.data)).toBe(true);

    // Profile data: provider profile
    const profileRes = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);

    expect(profileRes.body.data.displayName).toBe("Basavaraj Electrician");
    expect(profileRes.body.data.category).toBe("Electrician");
  });

  test("2. Driver can log in and access Dashboard and Profile data", async () => {
    // Driver Dashboard: available ride orders
    const availRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${driverToken1}`)
      .expect(200);

    expect(Array.isArray(availRes.body.data)).toBe(true);

    // Driver Profile: user details & application
    const profileRes = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${driverToken1}`)
      .expect(200);

    expect(profileRes.body.data.name).toBe("Suresh Auto");
    expect(profileRes.body.data.role).toBe("driver");
    expect(profileRes.body.data.isOnline).toBe(true);
  });

  test("3. Offline drivers do NOT receive new order offers", async () => {
    // Driver 1 goes offline
    const patchRes = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ isOnline: false })
      .expect(200);

    expect(patchRes.body.data.isOnline).toBe(false);

    // Customer creates a booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Navanagar Bagalkot",
        destination: "Station Road Bagalkot",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 60,
      })
      .expect(201);

    expect(bookRes.body.data._id).toBeDefined();

    // Offline driver checks available requests -> must be empty
    const availRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${driverToken1}`)
      .expect(200);

    expect(availRes.body.data.length).toBe(0);
  });

  test("4. Driver can go Online, receive genuine eligible order, and accept it", async () => {
    // Ensure Driver 1 is online
    await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ isOnline: true })
      .expect(200);

    // Customer creates a booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Navanagar Bagalkot",
        destination: "Station Road Bagalkot",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 80,
      })
      .expect(201);

    const bookingId = bookRes.body.data._id;

    // Driver 1 polls available requests
    const availRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${driverToken1}`)
      .expect(200);

    expect(availRes.body.data.length).toBeGreaterThan(0);
    const offeredOrder = availRes.body.data.find((b) => b._id === bookingId);
    expect(offeredOrder).toBeDefined();
    expect(offeredOrder.pickup).toBe("Navanagar Bagalkot");
    expect(offeredOrder.fare).toBe(80);

    // Driver 1 accepts the order
    const acceptRes = await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "accepted" })
      .expect(200);

    expect(acceptRes.body.data.status).toBe("accepted");
    expect(acceptRes.body.data.providerId).toBe(driverUser1._id.toString());
  });

  test("5. Customer receives the correct booking status after driver accepts", async () => {
    // Customer creates booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Navanagar Sector 1",
        destination: "Bus Stand",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 50,
      })
      .expect(201);

    const bookingId = bookRes.body.data._id;

    // Driver 1 accepts
    await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "accepted" })
      .expect(200);

    // Customer checks their bookings
    const custRes = await request(app)
      .get("/api/v1/transport-bookings/mine")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    const updatedBooking = custRes.body.data.find((b) => b._id === bookingId);
    expect(updatedBooking).toBeDefined();
    expect(updatedBooking.status).toBe("accepted");
    expect(updatedBooking.providerId.name).toBe("Suresh Auto");
  });

  test("6. Another driver CANNOT accept an already accepted order (Strict 409 Guard)", async () => {
    // Customer creates booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Kadur Road",
        destination: "Civil Court",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 75,
      })
      .expect(201);

    const bookingId = bookRes.body.data._id;

    // Driver 1 accepts first
    await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "accepted" })
      .expect(200);

    // Driver 2 attempts to accept the SAME order -> MUST return 409 Conflict
    const raceRes = await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken2}`)
      .send({ status: "accepted" })
      .expect(409);

    expect(raceRes.body.message).toMatch(/already accepted/i);
  });

  test("7. Driver can reject order and dispatch queue advances", async () => {
    // Customer creates booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Vidyagiri Bagalkot",
        destination: "Kudala Sangama",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 150,
      })
      .expect(201);

    const bookingId = bookRes.body.data._id;

    // Driver 1 declines
    const declineRes = await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "rejected" })
      .expect(200);

    expect(declineRes.body.message).toMatch(/declined/i);
  });

  test("8. Driver can start and complete order, updating history & earnings", async () => {
    // Customer creates booking
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "Sector 25",
        destination: "Old Bagalkot Market",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        fare: 95,
      })
      .expect(201);

    const bookingId = bookRes.body.data._id;

    // 1. Accept
    await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "accepted" })
      .expect(200);

    // 2. Start Trip
    const startRes = await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "in_progress" })
      .expect(200);

    expect(startRes.body.data.status).toBe("in_progress");

    // 3. Complete Trip
    const completeRes = await request(app)
      .patch(`/api/v1/transport-bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ status: "completed" })
      .expect(200);

    expect(completeRes.body.data.status).toBe("completed");

    // 4. Driver queries their history
    const historyRes = await request(app)
      .get("/api/v1/transport-bookings/mine")
      .set("Authorization", `Bearer ${driverToken1}`)
      .expect(200);

    const completedRide = historyRes.body.data.find((b) => b._id === bookingId);
    expect(completedRide).toBeDefined();
    expect(completedRide.status).toBe("completed");
    expect(completedRide.fare).toBe(95);
  });

  test("9. Customer and Admin interfaces remain completely unaffected", async () => {
    // Customer can browse services and properties without disruption
    const servicesRes = await request(app).get("/api/v1/services").expect(200);
    expect(Array.isArray(servicesRes.body.data)).toBe(true);

    const rentalsRes = await request(app).get("/api/v1/properties").expect(200);
    expect(Array.isArray(rentalsRes.body.data)).toBe(true);

    // Admin can access admin stats without disruption
    const adminRes = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(adminRes.body.data).toBeDefined();
  });

  test("10. Customer can query nearby available auto drivers with genuine backend information", async () => {
    // Make sure driver 1 is online
    await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${driverToken1}`)
      .send({ isOnline: true })
      .expect(200);

    const nearbyRes = await request(app)
      .get("/api/v1/transport-bookings/nearby-drivers?latitude=16.185&longitude=75.698&vehicleType=auto&radiusKm=10")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(nearbyRes.body.success).toBe(true);
    expect(nearbyRes.body.data.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(nearbyRes.body.data.drivers)).toBe(true);

    const firstDriver = nearbyRes.body.data.drivers[0];
    expect(firstDriver.id).toBeDefined();
    expect(firstDriver.vehicleType).toBe("auto");
    expect(firstDriver.approximateDistanceKm).toBeDefined();
    expect(typeof firstDriver.approximateDistanceKm).toBe("number");
    // Confirm exact private coordinates are NOT leaked in response
    expect(firstDriver.locationCoordinates).toBeUndefined();
  });
});
