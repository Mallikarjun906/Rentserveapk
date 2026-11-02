const mongoose = require("mongoose");
const TransportMessage = require("../models/TransportMessage");
const TransportBooking = require("../models/TransportBooking");
const Booking = require("../models/Booking");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Helper to find and authorize a conversation thread across Conversation, TransportBooking, or Booking
async function findAndAuthorizeBooking(bookingId, user) {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid conversation identifier.");
  }

  // 1. Check Direct Conversation Model
  const conv = await Conversation.findById(bookingId)
    .populate("participants", "name role phone email")
    .populate("customerId", "name role phone email")
    .populate("providerId", "name role phone email");

  if (conv) {
    const isParticipant = conv.participants?.some(
      (p) => p._id?.toString() === user.id || p.toString() === user.id
    );
    if (!isParticipant && user.role !== "admin") {
      throw new ApiError(403, "You are not authorized to view this conversation.");
    }

    const other = conv.participants?.find(
      (p) => (p._id?.toString() || p.toString()) !== user.id
    );

    return {
      conversation: conv,
      type: conv.contextType || "direct",
      customer: conv.customerId || (user.id === other?._id?.toString() ? user : other),
      provider: conv.providerId || (user.id === other?._id?.toString() ? other : user),
      recipient: other,
      status: "active",
    };
  }

  // 2. Check TransportBooking
  const tBooking = await TransportBooking.findById(bookingId)
    .populate("customerId", "name role phone email")
    .populate("providerId", "name role phone email");

  if (tBooking) {
    const isCustomer = tBooking.customerId?._id?.toString() === user.id;
    const isProvider = tBooking.providerId?._id?.toString() === user.id;
    if (!isCustomer && !isProvider && user.role !== "admin") {
      throw new ApiError(403, "You are not authorized to view this conversation.");
    }
    const recipient = isCustomer ? tBooking.providerId : tBooking.customerId;
    return {
      booking: tBooking,
      type: "transport",
      customer: tBooking.customerId,
      provider: tBooking.providerId,
      recipient,
      status: tBooking.status,
    };
  }

  // 3. Check Service / Property Booking
  const sBooking = await Booking.findById(bookingId)
    .populate("customerId", "name role phone email")
    .populate("providerId", "name role phone email")
    .populate("ownerId", "name role phone email");

  if (sBooking) {
    const isCustomer = sBooking.customerId?._id?.toString() === user.id;
    const isProvider = sBooking.providerId?._id?.toString() === user.id;
    const isOwner = sBooking.ownerId?._id?.toString() === user.id;
    const isEligible = sBooking.eligibleProviders?.some(
      (p) => p.toString() === user.id
    );
    if (!isCustomer && !isProvider && !isOwner && !isEligible && user.role !== "admin") {
      throw new ApiError(403, "You are not authorized to view this conversation.");
    }
    const recipient = isCustomer
      ? sBooking.providerId || sBooking.ownerId
      : sBooking.customerId;

    return {
      booking: sBooking,
      type: sBooking.bookingType || "service",
      customer: sBooking.customerId,
      provider: sBooking.providerId || sBooking.ownerId,
      recipient,
      status: sBooking.status,
    };
  }

  throw new ApiError(404, "Conversation thread not found.");
}

// 1. Get or create a direct conversation between customer and provider/owner
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { recipientId, serviceId, propertyId, title } = req.body;

  if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
    throw new ApiError(400, "Valid recipientId is required.");
  }

  if (recipientId === req.user.id) {
    throw new ApiError(400, "You cannot start a conversation with yourself.");
  }

  const recipientUser = await User.findById(recipientId).select("name role phone email location");
  if (!recipientUser) {
    throw new ApiError(404, "Recipient user not found.");
  }

  // Find existing conversation between these participants
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, recipientId] },
    ...(serviceId ? { serviceId } : {}),
    ...(propertyId ? { propertyId } : {}),
  })
    .populate("participants", "name role phone email")
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone");

  if (!conversation) {
    // Also check if any direct conversation between these two exists
    conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
    })
      .populate("participants", "name role phone email")
      .populate("customerId", "name role phone")
      .populate("providerId", "name role phone");
  }

  if (!conversation) {
    const isCurrentUserProvider = req.user.role === "provider" || req.user.role === "driver";
    const isRecipientProvider = recipientUser.role === "provider" || recipientUser.role === "driver";

    conversation = await Conversation.create({
      participants: [req.user.id, recipientId],
      customerId: isCurrentUserProvider ? recipientId : req.user.id,
      providerId: isRecipientProvider ? recipientId : req.user.id,
      serviceId: serviceId || null,
      propertyId: propertyId || null,
      contextType: serviceId ? "service" : propertyId ? "property" : "direct",
      title: title || (isRecipientProvider ? recipientUser.name : "Direct Conversation"),
      lastMessage: "Conversation started",
      lastMessageAt: new Date(),
    });

    await conversation.populate("participants", "name role phone email");
  }

  res.status(200).json(
    new ApiResponse(200, {
      conversationId: conversation._id,
      id: conversation._id,
      bookingId: conversation._id,
      recipient: {
        id: recipientUser._id,
        name: recipientUser.name,
        role: recipientUser.role === "provider" ? "Service Provider" : recipientUser.role,
        phone: recipientUser.phone || "",
      },
      conversation,
    }, "Conversation ready.")
  );
});

// 2. Get user's active conversations
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const threads = [];
  const seenIds = new Set();

  // A. Direct Conversations
  const directConvs = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "name role phone")
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .sort({ lastMessageAt: -1 })
    .limit(50);

  for (const c of directConvs) {
    const other = c.participants?.find((p) => p._id?.toString() !== userId);
    const otherName = other?.name || "User";
    const otherRole =
      other?.role === "provider"
        ? "Service Provider"
        : other?.role === "driver"
        ? "Driver"
        : other?.role === "owner"
        ? "Property Owner"
        : "Customer";

    const lastMsg = await TransportMessage.findOne({ bookingId: c._id }).sort({ createdAt: -1 });
    const unreadCount = await TransportMessage.countDocuments({
      bookingId: c._id,
      senderId: { $ne: userId },
      readAt: null,
    });

    threads.push({
      id: c._id.toString(),
      bookingId: c._id.toString(),
      bookingType: c.contextType || "direct",
      name: otherName,
      role: otherRole,
      phone: other?.phone || "",
      lastMessage: lastMsg ? lastMsg.message : c.lastMessage || "Conversation started",
      time: lastMsg ? lastMsg.createdAt : c.lastMessageAt || c.updatedAt,
      unread: unreadCount,
      status: "active",
    });
    seenIds.add(c._id.toString());
  }

  // B. Transport trips
  const transportTrips = await TransportBooking.find({
    $or: [{ customerId: userId }, { providerId: userId }],
    status: { $in: ["accepted", "in_progress", "completed", "pending"] },
  })
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .sort({ updatedAt: -1 })
    .limit(50);

  for (const t of transportTrips) {
    if (seenIds.has(t._id.toString())) continue;
    const isMeCustomer = t.customerId?._id?.toString() === userId;
    const other = isMeCustomer ? t.providerId : t.customerId;
    const otherName = other?.name || (isMeCustomer ? "Assigned Driver" : "Passenger");
    const otherRole = isMeCustomer
      ? `${t.vehicleType ? t.vehicleType.toUpperCase() : "Transport"} Driver`
      : "Passenger";
    const otherPhone = other?.phone || "";

    const lastMsg = await TransportMessage.findOne({ bookingId: t._id }).sort({ createdAt: -1 });
    const unreadCount = await TransportMessage.countDocuments({
      bookingId: t._id,
      senderId: { $ne: userId },
      readAt: null,
    });

    threads.push({
      id: t._id.toString(),
      bookingId: t._id.toString(),
      bookingType: "transport",
      name: otherName,
      role: otherRole,
      phone: otherPhone,
      lastMessage: lastMsg ? lastMsg.message : `Trip: ${t.pickup} → ${t.destination}`,
      time: lastMsg ? lastMsg.createdAt : t.updatedAt,
      unread: unreadCount,
      status: t.status,
    });
    seenIds.add(t._id.toString());
  }

  // C. Service & Rental bookings
  const serviceBookings = await Booking.find({
    $or: [
      { customerId: userId },
      { providerId: userId },
      { ownerId: userId },
      { eligibleProviders: userId },
    ],
    status: { $in: ["accepted", "completed", "pending"] },
  })
    .populate("customerId", "name role phone")
    .populate("providerId", "name role phone")
    .populate("ownerId", "name role phone")
    .sort({ updatedAt: -1 })
    .limit(50);

  for (const b of serviceBookings) {
    if (seenIds.has(b._id.toString())) continue;
    const isMeCustomer = b.customerId?._id?.toString() === userId;
    const other = isMeCustomer ? b.providerId || b.ownerId : b.customerId;
    const otherName = other?.name || (isMeCustomer ? "Service Provider" : "Customer");
    const otherRole = isMeCustomer ? b.category || "Service Provider" : "Customer";
    const otherPhone = other?.phone || "";

    const lastMsg = await TransportMessage.findOne({ bookingId: b._id }).sort({ createdAt: -1 });
    const unreadCount = await TransportMessage.countDocuments({
      bookingId: b._id,
      senderId: { $ne: userId },
      readAt: null,
    });

    threads.push({
      id: b._id.toString(),
      bookingId: b._id.toString(),
      bookingType: b.bookingType || "service",
      name: otherName,
      role: otherRole,
      phone: otherPhone,
      lastMessage: lastMsg ? lastMsg.message : b.message || `Service: ${b.category || "Booking"}`,
      time: lastMsg ? lastMsg.createdAt : b.updatedAt,
      unread: unreadCount,
      status: b.status,
    });
    seenIds.add(b._id.toString());
  }

  // Sort latest first
  threads.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  res.json(new ApiResponse(200, threads));
});

// 3. Get messages for a booking / conversation
const getMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  await findAndAuthorizeBooking(bookingId, req.user);

  // Mark all unread incoming messages as read
  await TransportMessage.updateMany(
    {
      bookingId,
      senderId: { $ne: req.user.id },
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  const messages = await TransportMessage.find({ bookingId })
    .populate("senderId", "name role")
    .sort({ createdAt: 1 })
    .limit(300);

  res.json(new ApiResponse(200, messages));
});

// 4. Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const authInfo = await findAndAuthorizeBooking(bookingId, req.user);

  const text = String(req.body.message || "").trim();
  if (!text || text.length > 2000) {
    throw new ApiError(400, "Message must contain between 1 and 2000 characters.");
  }

  const recipient = authInfo.recipient;

  const saved = await TransportMessage.create({
    bookingId,
    conversationId: authInfo.conversation?._id || null,
    senderId: req.user.id,
    recipientId: recipient?._id || recipient || null,
    message: text,
  });

  await saved.populate("senderId", "name role");

  // Update last message in Conversation or Booking
  if (authInfo.conversation) {
    await Conversation.findByIdAndUpdate(authInfo.conversation._id, {
      lastMessage: text,
      lastMessageAt: new Date(),
    });
  }

  res.status(201).json(new ApiResponse(201, saved, "Message sent."));
});

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
};
