const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const User = require("../src/models/User");
const ProviderApplication = require("../src/models/ProviderApplication");
const ServiceProvider = require("../src/models/ServiceProvider");
const ServiceListing = require("../src/models/ServiceListing");
const ServiceCategory = require("../src/models/ServiceCategory");
const TransportBooking = require("../src/models/TransportBooking");
const TransportMessage = require("../src/models/TransportMessage");
const Conversation = require("../src/models/Conversation");
const socketService = require("../src/services/socketService");

jest.setTimeout(120000);

let mongoServer;
let app;

function signTestToken(user) {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "test-secret";
  return jwt.sign(
    {
      sub: user._id.toString(),
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      approvalStatus: user.approvalStatus || "approved",
    },
    secret,
    { expiresIn: "1h" }
  );
}

beforeAll(async () => {
  process.env.JWT_SECRET = "test-jwt-secret-key-32-characters-long";
  process.env.JWT_ACCESS_SECRET = "test-jwt-secret-key-32-characters-long";
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
  await ProviderApplication.deleteMany({});
  await ServiceProvider.deleteMany({});
  await ServiceListing.deleteMany({});
  await ServiceCategory.deleteMany({});
  await TransportBooking.deleteMany({});
  await TransportMessage.deleteMany({});
  await Conversation.deleteMany({});
});

describe("Location Tracking, Ride Dispatch & Messaging Tests", () => {
  test("1. Driver updates online GPS dispatch location and stores 2dsphere GeoJSON", async () => {
    const driver = await User.create({
      name: "Ramesh Auto Driver",
      email: "ramesh.driver@test.com",
      phone: "9876543210",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    await ProviderApplication.create({
      userId: driver._id,
      fullName: driver.name,
      phone: driver.phone,
      email: driver.email,
      applicationType: "driver",
      category: "Auto",
      vehicleType: "auto",
      city: "Jamkhandi",
      taluk: "Jamkhandi",
      district: "Bagalkot",
      status: "approved",
      consent: true,
      isOnline: true,
    });

    const token = signTestToken(driver);

    // Driver broadcasts GPS coords in Jamkhandi (16.505, 75.295)
    const res = await request(app)
      .patch("/api/v1/transport-bookings/location")
      .set("Authorization", `Bearer ${token}`)
      .send({
        locationCoordinates: {
          latitude: 16.505,
          longitude: 75.295,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locationCoordinates.latitude).toBe(16.505);

    // Verify MongoDB storage & GeoJSON Point
    const appRecord = await ProviderApplication.findOne({ userId: driver._id });
    expect(appRecord.locationCoordinates.latitude).toBe(16.505);
    expect(appRecord.location).toBeDefined();
    expect(appRecord.location.type).toBe("Point");
    expect(appRecord.location.coordinates[0]).toBe(75.295);
    expect(appRecord.location.coordinates[1]).toBe(16.505);
  });

  test("2. Nearby drivers query returns available online drivers with realistic ETA", async () => {
    const customer = await User.create({
      name: "Suresh Customer",
      email: "suresh@test.com",
      phone: "9876500001",
      role: "customer",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const driver = await User.create({
      name: "Mallikarjun Driver",
      email: "mallikarjun@test.com",
      phone: "9876500002",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    await ProviderApplication.create({
      userId: driver._id,
      fullName: driver.name,
      phone: driver.phone,
      email: driver.email,
      applicationType: "driver",
      category: "Auto",
      vehicleType: "auto",
      city: "Jamkhandi",
      status: "approved",
      consent: true,
      isOnline: true,
      locationCoordinates: { latitude: 16.508, longitude: 75.298 },
      location: { type: "Point", coordinates: [75.298, 16.508] },
    });

    const token = signTestToken(customer);

    const res = await request(app)
      .get("/api/v1/transport-bookings/nearby-drivers?latitude=16.505&longitude=75.295&vehicleType=auto")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data.drivers[0].id).toBe(driver._id.toString());
    expect(res.body.data.drivers[0].approximateDistanceKm).toBeLessThan(2);
    expect(res.body.data.drivers[0].estimatedEtaMinutes).toBeGreaterThanOrEqual(2);
  });

  test("3. Customer requests a ride in Jamkhandi, online driver receives it in available queue", async () => {
    const customer = await User.create({
      name: "Anand Customer",
      email: "anand@test.com",
      phone: "9111111111",
      role: "customer",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const driver = await User.create({
      name: "Basavaraj Driver",
      email: "basavaraj@test.com",
      phone: "9222222222",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    await ProviderApplication.create({
      userId: driver._id,
      fullName: driver.name,
      phone: driver.phone,
      email: driver.email,
      applicationType: "driver",
      category: "Auto",
      vehicleType: "auto",
      city: "Jamkhandi",
      taluk: "Jamkhandi",
      district: "Bagalkot",
      status: "approved",
      consent: true,
      isOnline: true,
      locationCoordinates: { latitude: 16.505, longitude: 75.295 },
    });

    const customerToken = signTestToken(customer);
    const driverToken = signTestToken(driver);

    // Customer creates auto booking with fare offer
    const bookRes = await request(app)
      .post("/api/v1/transport-bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleType: "auto",
        pickup: "KSRTC Bus Stand, Jamkhandi",
        destination: "Girigowda Circle, Jamkhandi",
        scheduledAt: new Date(Date.now() + 600000).toISOString(),
        details: "Customer offered fare: ₹60",
        fare: 60,
        pickupCoordinates: { latitude: 16.505, longitude: 75.295 },
        destinationCoordinates: { latitude: 16.512, longitude: 75.302 },
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    const bookingId = bookRes.body.data._id;
    expect(bookingId).toBeDefined();

    // Driver fetches available requests
    const availRes = await request(app)
      .get("/api/v1/transport-bookings/available")
      .set("Authorization", `Bearer ${driverToken}`);

    expect(availRes.status).toBe(200);
    expect(availRes.body.success).toBe(true);
    expect(availRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(availRes.body.data[0]._id).toBe(bookingId);
    expect(availRes.body.data[0].pickup).toBe("KSRTC Bus Stand, Jamkhandi");
    expect(availRes.body.data[0].fare).toBe(60);
  });

  test("4. Atomic ride acceptance guards against two drivers accepting the same ride", async () => {
    const customer = await User.create({
      name: "Customer Two",
      email: "cust2@test.com",
      phone: "9333333331",
      role: "customer",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const driver1 = await User.create({
      name: "Driver One",
      email: "drv1@test.com",
      phone: "9333333332",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    const driver2 = await User.create({
      name: "Driver Two",
      email: "drv2@test.com",
      phone: "9333333333",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    for (const d of [driver1, driver2]) {
      await ProviderApplication.create({
        userId: d._id,
        fullName: d.name,
        phone: d.phone,
        email: d.email,
        applicationType: "driver",
        category: "Auto",
        vehicleType: "auto",
        city: "Jamkhandi",
        status: "approved",
        consent: true,
        isOnline: true,
      });
    }

    const booking = await TransportBooking.create({
      customerId: customer._id,
      vehicleType: "auto",
      pickup: "Kadirampura Cross, Jamkhandi",
      destination: "Court Road, Jamkhandi",
      scheduledAt: new Date(Date.now() + 100000),
      fare: 70,
      status: "pending",
      dispatchQueue: [driver1._id, driver2._id],
      activeProviderId: driver1._id,
      dispatchExpiresAt: new Date(Date.now() + 60000),
    });

    const token1 = signTestToken(driver1);
    const token2 = signTestToken(driver2);

    // Driver 1 accepts
    const accept1 = await request(app)
      .patch(`/api/v1/transport-bookings/${booking._id}/status`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ status: "accepted" });

    expect(accept1.status).toBe(200);
    expect(accept1.body.data.status).toBe("accepted");
    expect((accept1.body.data.providerId?._id || accept1.body.data.providerId).toString()).toBe(driver1._id.toString());

    // Driver 2 attempts to accept the same booking - must fail with 409 Conflict
    const accept2 = await request(app)
      .patch(`/api/v1/transport-bookings/${booking._id}/status`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ status: "accepted" });

    expect(accept2.status).toBe(409);
  });

  test("5. Driver live GPS broadcast during active trip updates coordinates and customer tracking snapshot", async () => {
    const customer = await User.create({
      name: "Trip Customer",
      email: "tripcust@test.com",
      phone: "9444444441",
      role: "customer",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const driver = await User.create({
      name: "Trip Driver",
      email: "tripdriver@test.com",
      phone: "9444444442",
      role: "driver",
      approvalStatus: "approved",
      location: "Jamkhandi",
      isOnline: true,
    });

    await ProviderApplication.create({
      userId: driver._id,
      fullName: driver.name,
      phone: driver.phone,
      email: driver.email,
      applicationType: "driver",
      category: "Auto",
      vehicleType: "auto",
      city: "Jamkhandi",
      status: "approved",
      consent: true,
      isOnline: true,
    });

    const booking = await TransportBooking.create({
      customerId: customer._id,
      providerId: driver._id,
      vehicleType: "auto",
      pickup: "College Road, Jamkhandi",
      destination: "Government Hospital, Jamkhandi",
      scheduledAt: new Date(Date.now() + 100000),
      fare: 50,
      status: "accepted",
    });

    const driverToken = signTestToken(driver);
    const customerToken = signTestToken(customer);

    // Driver broadcasts moving GPS coordinates
    const updateLoc = await request(app)
      .patch(`/api/v1/transport-bookings/${booking._id}/location`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({
        locationCoordinates: { latitude: 16.5075, longitude: 75.2965 },
        accuracy: 8,
        heading: 120,
        speed: 24,
      });

    expect(updateLoc.status).toBe(200);
    expect(updateLoc.body.data.liveLocation.latitude).toBe(16.5075);
    expect(updateLoc.body.data.liveLocation.heading).toBe(120);

    // Customer polls tracking snapshot
    const trackRes = await request(app)
      .get(`/api/v1/transport-bookings/${booking._id}/tracking`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.liveLocation.latitude).toBe(16.5075);
    expect(trackRes.body.data.liveLocation.longitude).toBe(75.2965);
    expect(trackRes.body.data.providerId.name).toBe("Trip Driver");
  });

  test("6. Customer-to-Provider messaging: conversation creation, message send, and message retrieval", async () => {
    const customer = await User.create({
      name: "Customer Vijay",
      email: "vijay.customer@test.com",
      phone: "9555555551",
      role: "customer",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const providerUser = await User.create({
      name: "Praveen Electrician",
      email: "praveen.electrician@test.com",
      phone: "9555555552",
      role: "provider",
      approvalStatus: "approved",
      location: "Jamkhandi",
    });

    const cat = await ServiceCategory.create({
      name: "Electrician",
      slug: "electrician",
      description: "Electrical repairs and installations",
    });

    const service = await ServiceListing.create({
      providerId: providerUser._id,
      categoryId: cat._id,
      title: "Praveen Electrical Services Jamkhandi",
      description: "Fast home electrical wiring and motor rewinding",
      location: "Jamkhandi",
      priceRange: { min: 250, max: 500 },
      status: "published",
    });

    const customerToken = signTestToken(customer);
    const providerToken = signTestToken(providerUser);

    // 1. Customer initiates conversation from service profile
    const convRes = await request(app)
      .post("/api/v1/chat/conversation")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        recipientId: providerUser._id.toString(),
        serviceId: service._id.toString(),
        title: "Praveen Electrical Services Jamkhandi",
      });

    expect(convRes.status).toBe(200);
    expect(convRes.body.success).toBe(true);
    const convId = convRes.body.data.conversationId;
    expect(convId).toBeDefined();

    // 2. Customer sends a message
    const msgRes = await request(app)
      .post(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        message: "Hello Praveen, can you come to Jamkhandi Main Road tomorrow morning at 10 AM?",
      });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.success).toBe(true);
    expect(msgRes.body.data.message).toContain("Jamkhandi Main Road");

    // 3. Provider fetches messages (marks unread as read)
    const getRes = await request(app)
      .get(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].message).toContain("10 AM");

    // 4. Provider replies to customer
    const replyRes = await request(app)
      .post(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        message: "Yes sir, I will be there at 10:00 AM promptly.",
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.message).toContain("promptly");

    // 5. Customer fetches messages and sees reply
    const finalRes = await request(app)
      .get(`/api/v1/chat/${convId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.length).toBe(2);
    expect(finalRes.body.data[1].senderId._id.toString()).toBe(providerUser._id.toString());
  });
});
