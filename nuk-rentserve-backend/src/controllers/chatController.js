const mongoose = require("mongoose");
const TransportMessage = require("../models/TransportMessage");
const TransportBooking = require("../models/TransportBooking");
const Booking = require("../models/Booking");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Helper to find and authorize booking (either transport or service/rental)
async function findAndAuthorizeBooking(bookingId, user) {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking identifier.");
  }

  // 1. Check TransportBooking
  const tBooking = await TransportBooking.findById(bookingId)
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone");

  if (tBooking) {
    const isCustomer = tBooking.customerId?._id?.toString() === user.id;
    const isProvider = tBooking.providerId?._id?.toString() === user.id;
    if (!isCustomer && !isProvider && user.role !== "admin") {
      throw new ApiError(403, "You are not authorized to view this conversation.");
    }
    return {
      booking: tBooking,
      type: "transport",
      customer: tBooking.customerId,
      provider: tBooking.providerId,
      status: tBooking.status
    };
  }

  // 2. Check Service / Property Booking
  const sBooking = await Booking.findById(bookingId)
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .populate("ownerId", "name role phone");

  if (sBooking) {
    const isCustomer = sBooking.customerId?._id?.toString() === user.id;
    const isProvider = sBooking.providerId?._id?.toString() === user.id;
    const isOwner = sBooking.ownerId?._id?.toString() === user.id;
    if (!isCustomer && !isProvider && !isOwner && user.role !== "admin") {
      throw new ApiError(403, "You are not authorized to view this conversation.");
    }
    return {
      booking: sBooking,
      type: sBooking.bookingType || "service",
      customer: sBooking.customerId,
      provider: sBooking.providerId || sBooking.ownerId,
      status: sBooking.status
    };
  }

  throw new ApiError(404, "Booking conversation not found.");
}

// 1. Get user's active conversations
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find user's transport trips (accepted, in_progress, completed)
  const transportTrips = await TransportBooking.find({
    $or: [{ customerId: userId }, { providerId: userId }],
    status: { $in: ["accepted", "in_progress", "completed", "pending"] }
  })
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .sort({ updatedAt: -1 })
    .limit(50);

  // Find user's service and rental bookings (accepted, pending, completed)
  const serviceBookings = await Booking.find({
    $or: [
      { customerId: userId },
      { providerId: userId },
      { ownerId: userId },
      { eligibleProviders: userId }
    ],
    status: { $in: ["accepted", "completed", "pending"] }
  })
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .populate("ownerId", "name role phone")
    .sort({ updatedAt: -1 })
    .limit(50);

  const threads = [];

  // Map transport trips to conversation threads
  for (const t of transportTrips) {
    const isMeCustomer = t.customerId?._id?.toString() === userId;
    const other = isMeCustomer ? t.providerId : t.customerId;
    const otherName = other?.name || (isMeCustomer ? "Assigned Driver" : "Passenger");
    const otherRole = isMeCustomer
      ? `${t.vehicleType ? t.vehicleType.toUpperCase() : "Transport"} Driver`
      : "Passenger";
    const otherPhone = other?.phone || "";

    const lastMsg = await TransportMessage.findOne({ bookingId: t._id }).sort({ createdAt: -1 });

    threads.push({
      id: t._id.toString(),
      bookingId: t._id.toString(),
      bookingType: "transport",
      name: otherName,
      role: otherRole,
      phone: otherPhone,
      lastMessage: lastMsg ? lastMsg.message : `Trip: ${t.pickup} → ${t.destination}`,
      time: lastMsg ? lastMsg.createdAt : t.updatedAt,
      unread: 0,
      status: t.status
    });
  }

  // Map service bookings to conversation threads
  for (const b of serviceBookings) {
    const isMeCustomer = b.customerId?._id?.toString() === userId;
    const other = isMeCustomer ? (b.providerId || b.ownerId) : b.customerId;
    const otherName = other?.name || (isMeCustomer ? "Service Provider" : "Customer");
    const otherRole = isMeCustomer
      ? b.category || "Service Provider"
      : "Customer";
    const otherPhone = other?.phone || "";

    const lastMsg = await TransportMessage.findOne({ bookingId: b._id }).sort({ createdAt: -1 });

    threads.push({
      id: b._id.toString(),
      bookingId: b._id.toString(),
      bookingType: b.bookingType || "service",
      name: otherName,
      role: otherRole,
      phone: otherPhone,
      lastMessage: lastMsg ? lastMsg.message : (b.message || `Service: ${b.category || "Booking"}`),
      time: lastMsg ? lastMsg.createdAt : b.updatedAt,
      unread: 0,
      status: b.status
    });
  }

  // Sort latest first
  threads.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  res.json(new ApiResponse(200, threads));
});

// 2. Get messages for a booking
const getMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  await findAndAuthorizeBooking(bookingId, req.user);

  const messages = await TransportMessage.find({ bookingId })
    .populate("senderId", "name role")
    .sort({ createdAt: 1 })
    .limit(300);

  res.json(new ApiResponse(200, messages));
});

// 3. Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { booking, customer, provider } = await findAndAuthorizeBooking(bookingId, req.user);

  const text = String(req.body.message || "").trim();
  if (!text || text.length > 2000) {
    throw new ApiError(400, "Message must contain between 1 and 2000 characters.");
  }

  const saved = await TransportMessage.create({
    bookingId,
    senderId: req.user.id,
    message: text
  });

  await saved.populate("senderId", "name role");

  // Send notification to recipient
  const recipient = req.user.id === customer?._id?.toString() ? provider : customer;
  if (recipient) {
    // Optional notification call without blocking response
  }

  res.status(201).json(new ApiResponse(201, saved, "Message sent."));
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};
