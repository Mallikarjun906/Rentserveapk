const Notification = require("../models/Notification");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getIO } = require("../services/socketService");

const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = { userId: req.user.id };

  if (req.query.category && req.query.category !== "all") {
    filter.category = req.query.category;
  }
  if (req.query.unreadOnly === "true") {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user.id, isRead: false })
  ]);

  res.json(
    new ApiResponse(200, {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  if (!item) throw new ApiError(404, "Notification not found.");
  res.json(new ApiResponse(200, item, "Notification marked as read."));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json(new ApiResponse(200, null, "All notifications marked as read."));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  if (!item) throw new ApiError(404, "Notification not found.");
  res.json(new ApiResponse(200, null, "Notification deleted."));
});

const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Device token is required.");
  }
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { pushTokens: token.trim() }
  });
  res.json(new ApiResponse(200, null, "Device token registered."));
});

const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("notificationPreferences");
  res.json(
    new ApiResponse(
      200,
      user?.notificationPreferences || {
        rideNotifications: true,
        bookingNotifications: true,
        messageNotifications: true,
        enquiryNotifications: true,
        rentalNotifications: true,
        promoNotifications: false,
        sound: true,
        vibration: true
      }
    )
  );
});

const updatePreferences = asyncHandler(async (req, res) => {
  const allowed = [
    "rideNotifications",
    "bookingNotifications",
    "messageNotifications",
    "enquiryNotifications",
    "rentalNotifications",
    "promoNotifications",
    "sound",
    "vibration"
  ];
  const update = {};
  for (const k of allowed) {
    if (typeof req.body[k] === "boolean") {
      update[`notificationPreferences.${k}`] = req.body[k];
    }
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: update },
    { new: true }
  ).select("notificationPreferences");

  res.json(new ApiResponse(200, user.notificationPreferences, "Preferences updated."));
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const { role, title, description, category, data } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required.");
  }

  const userQuery = { isActive: true };
  if (role && role !== "all") {
    userQuery.role = role;
  }

  const users = await User.find(userQuery).select("_id role").lean();
  if (users.length === 0) {
    return res.json(new ApiResponse(200, { sentCount: 0 }, "No eligible recipients found."));
  }

  const docs = users.map((u) => ({
    userId: u._id,
    role: u.role,
    category: category || "system",
    title,
    description,
    data: data || {},
    isRead: false
  }));

  await Notification.insertMany(docs);

  // Broadcast to Socket.IO if connected
  const io = getIO();
  if (io) {
    for (const u of users) {
      io.to(`user:${u._id}`).emit("notification:new", {
        title,
        description,
        category: category || "system",
        data: data || {},
        createdAt: new Date().toISOString()
      });
    }
  }

  res.json(
    new ApiResponse(200, { sentCount: docs.length }, `Notification broadcast to ${docs.length} users.`)
  );
});

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerDeviceToken,
  getPreferences,
  updatePreferences,
  broadcastNotification
};
