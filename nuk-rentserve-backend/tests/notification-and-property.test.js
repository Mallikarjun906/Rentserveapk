const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const User = require("../src/models/User");
const Notification = require("../src/models/Notification");
const Property = require("../src/models/Property");

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
    { sub: user._id.toString(), id: user._id.toString(), role: user.role },
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

describe("Notification & Property System Tests", () => {
  let customerUser, studentUser, adminUser;
  let customerToken, studentToken, adminToken;

  beforeEach(async () => {
    await Notification.deleteMany({});
    await Property.deleteMany({});
    await User.deleteMany({});

    customerUser = await User.create({
      name: "Ramesh Customer",
      email: "ramesh@example.com",
      phone: "+919876543210",
      role: "customer",
      location: "Jamkhandi",
      approvalStatus: "approved"
    });
    customerToken = makeToken(customerUser);

    studentUser = await User.create({
      name: "Vijay Student",
      email: "vijay@example.com",
      phone: "+919876543211",
      role: "student",
      location: "Bagalkot",
      approvalStatus: "approved"
    });
    studentToken = makeToken(studentUser);

    adminUser = await User.create({
      name: "Admin Super",
      email: "admin@example.com",
      phone: "+919876543212",
      role: "admin",
      location: "Belagavi",
      approvalStatus: "approved"
    });
    adminToken = makeToken(adminUser);
  });

  test("1. Device token registration adds push token to user profile", async () => {
    const res = await request(app)
      .post("/api/v1/notifications/device-token")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ token: "ExponentPushToken[xxxxxxxxxxxxxx]" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(customerUser._id);
    expect(updated.pushTokens).toContain("ExponentPushToken[xxxxxxxxxxxxxx]");
  });

  test("2. List notifications returns pagination and unread counts", async () => {
    await Notification.create([
      {
        userId: customerUser._id,
        role: "customer",
        category: "ride",
        title: "Driver Accepted",
        description: "Your Auto ride was accepted by driver Anand.",
        isRead: false
      },
      {
        userId: customerUser._id,
        role: "customer",
        category: "message",
        title: "New Message",
        description: "You have a new message.",
        isRead: true
      }
    ]);

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.unreadCount).toBe(1);
  });

  test("3. Mark notification as read updates status and readAt", async () => {
    const notif = await Notification.create({
      userId: customerUser._id,
      role: "customer",
      category: "booking",
      title: "Booking Confirmed",
      description: "Service booking is confirmed.",
      isRead: false
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).toBeDefined();
  });

  test("4. Mark all as read clears all unread notifications for user", async () => {
    await Notification.create([
      { userId: customerUser._id, title: "A", description: "A", isRead: false },
      { userId: customerUser._id, title: "B", description: "B", isRead: false }
    ]);

    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);

    const unread = await Notification.countDocuments({ userId: customerUser._id, isRead: false });
    expect(unread).toBe(0);
  });

  test("5. Notification preferences can be fetched and updated", async () => {
    const getRes = await request(app)
      .get("/api/v1/notifications/preferences")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.rideNotifications).toBe(true);

    const patchRes = await request(app)
      .patch("/api/v1/notifications/preferences")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ promoNotifications: true, sound: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.promoNotifications).toBe(true);
    expect(patchRes.body.data.sound).toBe(false);
  });

  test("6. Student partner can create property listing with owner permission confirmation", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        type: "room",
        title: "Student Single Room Near Basaveshwar College",
        description: "Well ventilated room with study desk and water.",
        rent: 2500,
        deposit: 5000,
        address: "Vidyagiri, Bagalkot",
        location: "Bagalkot",
        ownerPermissionConfirmed: true,
        studentContact: "+919876543211",
        commissionAgreedAmount: 500
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.listedByRole).toBe("student");
    expect(res.body.data.ownerPermissionConfirmed).toBe(true);
    expect(res.body.data.studentContact).toBe("+919876543211");
  });

  test("7. GET /api/v1/properties/mine retrieves only user-created properties", async () => {
    await Property.create({
      ownerId: studentUser._id,
      type: "room",
      title: "Room 101",
      rent: 2000,
      deposit: 4000,
      address: "Bagalkot",
      location: "Bagalkot",
      listedByRole: "student"
    });

    const res = await request(app)
      .get("/api/v1/properties/mine")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Room 101");
  });
});
