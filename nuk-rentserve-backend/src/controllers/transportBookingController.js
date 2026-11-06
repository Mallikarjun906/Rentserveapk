const mongoose = require("mongoose");
const TransportBooking = require("../models/TransportBooking");
const TransportMessage = require("../models/TransportMessage");
const ProviderApplication = require("../models/ProviderApplication");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const typeToCategory = { auto: "Auto", car: "Passenger car", "goods-van": "Goods van" };
const DISPATCH_WINDOW_MS = 30_000;
const SEARCH_RADIUS_KM = 5;

function distanceKm(a, b) {
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function coords(value) {
  if (!value || value.latitude == null || value.longitude == null) return null;
  const latitude = Number(value.latitude), longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

async function getProviderQueue(vehicleType, pickup, pickupCoordinates, excluded = []) {
  const category = typeToCategory[vehicleType];
  let candidates = await ProviderApplication.find({
    category,
    status: "approved",
    isOnline: { $ne: false },
    userId: { $nin: excluded }
  }).select("userId city taluk district locationCoordinates").lean();
  const pickupText = String(pickup || "").toLowerCase();
  const origin = coords(pickupCoordinates);
  candidates = candidates.map(p => {
    const locationText = `${p.city || ""} ${p.taluk || ""} ${p.district || ""}`.toLowerCase();
    const localMatch = locationText.split(/[^a-z0-9]+/).filter(x => x.length > 2).some(token => pickupText.includes(token));
    const providerCoords = coords(p.locationCoordinates);
    const distance = origin && providerCoords ? distanceKm(origin, providerCoords) : null;
    return { id: p.userId, localMatch, distance };
  });
  // When both parties have opted-in GPS coordinates, enforce the 5 km radius.
  // If coordinates are unavailable, use the available locality metadata and never fabricate a distance.
  if (origin) candidates = candidates.filter(p => p.distance !== null && p.distance <= SEARCH_RADIUS_KM);
  candidates.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.localMatch !== b.localMatch) return a.localMatch ? -1 : 1;
    return 0;
  });
  return candidates.map(p => p.id);
}

async function dispatchNext(booking) {
  const nextIndex = Number(booking.dispatchIndex || 0);
  const nextProviderId = booking.dispatchQueue?.[nextIndex];
  if (!nextProviderId) {
    booking.activeProviderId = null;
    booking.dispatchExpiresAt = null;
    booking.status = "unmatched";
    await booking.save();
    return false;
  }
  booking.activeProviderId = nextProviderId;
  booking.dispatchIndex = nextIndex + 1;
  booking.dispatchExpiresAt = new Date(Date.now() + DISPATCH_WINDOW_MS);
  await booking.save();
  return true;
}

async function advanceExpiredForProvider() {
  const expired = await TransportBooking.find({
    status: "pending", activeProviderId: { $ne: null },
    dispatchExpiresAt: { $ne: null, $lte: new Date() }
  }).limit(30);
  for (const item of expired) {
    // Atomic guard avoids two pollers advancing the same expired request.
    const claimed = await TransportBooking.findOneAndUpdate(
      { _id: item._id, status: "pending", activeProviderId: item.activeProviderId, dispatchExpiresAt: { $lte: new Date() } },
      { $set: { activeProviderId: null, dispatchExpiresAt: null }, $addToSet: { declinedBy: item.activeProviderId } },
      { new: true }
    );
    if (claimed) await dispatchNext(claimed);
  }
}

const create = asyncHandler(async (req, res) => {
  const { vehicleType, pickup, destination, scheduledAt, details = "", fare = 0, pickupCoordinates, destinationCoordinates } = req.body;
  if (!Object.hasOwn(typeToCategory, vehicleType)) throw new ApiError(400, "Choose a valid vehicle type.");
  const cleanPickup = String(pickup || "").trim();
  const cleanDestination = String(destination || "").trim();
  const when = new Date(scheduledAt);
  if (cleanPickup.length < 2 || cleanPickup.length > 200 || cleanDestination.length < 2 || cleanDestination.length > 200) throw new ApiError(400, "Pickup and destination must each be between 2 and 200 characters.");
  if (!scheduledAt || !Number.isFinite(when.getTime()) || when < new Date(Date.now() - 60000)) throw new ApiError(400, "Choose a valid future date and time.");
  if (String(details).length > 1200) throw new ApiError(400, "Details must be 1200 characters or fewer.");
  const origin = coords(pickupCoordinates);
  const destinationPoint = coords(destinationCoordinates);
  const queue = await getProviderQueue(vehicleType, cleanPickup, origin);
  const parsedFare = Number(fare) > 0 ? Number(fare) : 0;
  const booking = await TransportBooking.create({
    customerId: req.user.id, vehicleType, pickup: cleanPickup, destination: cleanDestination,
    scheduledAt: when, details: String(details).trim(), fare: parsedFare, pickupCoordinates: origin || undefined, destinationCoordinates: destinationPoint || undefined,
    dispatchQueue: queue, dispatchIndex: 0
  });
  if (queue.length) await dispatchNext(booking);
  else { booking.status = "unmatched"; await booking.save(); }
  const message = queue.length
    ? "Request saved. The nearest eligible provider is being notified; if they reject or do not respond in 30 seconds, the next provider will be notified."
    : "Request saved, but no approved provider matched this vehicle type. You can retry or expand your search area.";
  const publicBooking = booking.toObject(); delete publicBooking.dispatchQueue;
  res.status(201).json(new ApiResponse(201, publicBooking, message));
});

const mine = asyncHandler(async (req, res) => {
  const isDriverOrProvider = ["driver", "provider"].includes(req.user.role);
  const filter = isDriverOrProvider
    ? { providerId: req.user.id }
    : { customerId: req.user.id };
  const items = await TransportBooking.find(filter)
    .select("-dispatchQueue")
    .populate("providerId", "name phone email")
    .populate("customerId", "name phone email location")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(new ApiResponse(200, items));
});

const available = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findOne({ userId: req.user.id, status: "approved" }).select("category isOnline");
  if (!application) throw new ApiError(403, "Only approved providers can view transport requests.");
  const User = require("../models/User");
  const user = await User.findById(req.user.id).select("isOnline");
  if (user?.isOnline === false || application?.isOnline === false) {
    return res.json(new ApiResponse(200, []));
  }
  const vehicleType = Object.keys(typeToCategory).find((key) => typeToCategory[key] === application.category);
  if (!vehicleType) return res.json(new ApiResponse(200, []));
  await advanceExpiredForProvider();
  const items = await TransportBooking.find({
    vehicleType, status: "pending", activeProviderId: req.user.id,
    dispatchExpiresAt: { $gt: new Date() }
  }).select("-dispatchQueue").populate("customerId", "name phone location").sort({ scheduledAt: 1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const assigned = asyncHandler(async (req, res) => {
  const items = await TransportBooking.find({ providerId: req.user.id, status: { $in: ["accepted", "in_progress"] } })
    .select("-dispatchQueue").populate("customerId", "name phone location").sort({ updatedAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

async function authorizeChat(bookingId, user) {
  if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, "Invalid booking ID.");
  const booking = await TransportBooking.findById(bookingId).select("customerId providerId status");
  if (!booking) throw new ApiError(404, "Transport booking not found.");
  const isCustomer = user.role === "customer" && booking.customerId.toString() === user.id;
  const isAssignedDriver = ["provider", "driver"].includes(user.role) && booking.providerId && booking.providerId.toString() === user.id;
  if (!isCustomer && !isAssignedDriver && user.role !== "admin") throw new ApiError(403, "Only the customer and assigned driver can access this conversation.");
  if (booking.status !== "accepted") throw new ApiError(409, "Chat becomes available after a driver accepts the booking.");
  return booking;
}

const getMessages = asyncHandler(async (req, res) => {
  await authorizeChat(req.params.id, req.user);
  const items = await TransportMessage.find({ bookingId: req.params.id }).populate("senderId", "name role").sort({ createdAt: 1 }).limit(200);
  res.json(new ApiResponse(200, items));
});

const sendMessage = asyncHandler(async (req, res) => {
  await authorizeChat(req.params.id, req.user);
  const message = String(req.body.message || "").trim();
  if (!message || message.length > 2000) throw new ApiError(400, "Message must contain between 1 and 2000 characters.");
  const saved = await TransportMessage.create({ bookingId: req.params.id, senderId: req.user.id, message });
  await saved.populate("senderId", "name role");
  res.status(201).json(new ApiResponse(201, saved, "Message sent."));
});

const updateLocation = asyncHandler(async (req, res) => {
  const origin = coords(req.body.locationCoordinates);
  if (!origin) throw new ApiError(400, "Provide valid latitude and longitude coordinates.");
  const application = await ProviderApplication.findOneAndUpdate(
    { userId: req.user.id, status: "approved" },
    { $set: { locationCoordinates: origin } },
    { new: true }
  ).select("city taluk district locationCoordinates");
  if (!application) throw new ApiError(403, "Only approved providers can update dispatch location.");
  res.json(new ApiResponse(200, { locationCoordinates: application.locationCoordinates }, "Provider location updated for nearby dispatch."));
});

const getTracking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID.");
  const booking = await TransportBooking.findById(req.params.id).select("customerId providerId status pickup destination pickupCoordinates destinationCoordinates liveLocation updatedAt");
  if (!booking) throw new ApiError(404, "Transport booking not found.");
  const isCustomer = booking.customerId.toString() === req.user.id;
  const isAssignedProvider = booking.providerId && booking.providerId.toString() === req.user.id;
  if (!isCustomer && !isAssignedProvider && req.user.role !== "admin") throw new ApiError(403, "Only the customer and assigned provider can view live trip location.");
  res.json(new ApiResponse(200, booking));
});

const updateTripLocation = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.approvalStatus !== "approved") {
    throw new ApiError(403, "Unapproved drivers cannot broadcast live GPS tracking.");
  }
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID.");
  const point = coords(req.body.locationCoordinates);
  if (!point) throw new ApiError(400, "Provide valid latitude and longitude coordinates.");
  const accuracy = Number(req.body.accuracy);
  const heading = req.body.heading == null ? undefined : Number(req.body.heading);
  const speed = req.body.speed == null ? undefined : Number(req.body.speed);
  if (req.body.accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100000)) throw new ApiError(400, "Invalid location accuracy.");
  if (heading !== undefined && (!Number.isFinite(heading) || heading < 0 || heading > 360)) throw new ApiError(400, "Invalid heading.");
  if (speed !== undefined && (!Number.isFinite(speed) || speed < 0 || speed > 500)) throw new ApiError(400, "Invalid speed.");
  const updated = await TransportBooking.findOneAndUpdate(
    { _id: req.params.id, providerId: req.user.id, status: { $in: ["accepted", "in_progress"] } },
    { $set: { liveLocation: { ...point, ...(req.body.accuracy != null ? { accuracy } : {}), ...(heading !== undefined ? { heading } : {}), ...(speed !== undefined ? { speed } : {}), updatedAt: new Date() } } },
    { new: true, runValidators: true }
  ).select("_id status liveLocation updatedAt");
  if (!updated) throw new ApiError(409, "Location updates are allowed only for an active trip assigned to you.");
  res.json(new ApiResponse(200, updated, "Live location updated."));
});

const updateStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid booking ID.");
  const status = req.body.status;
  if (!["accepted", "rejected", "cancelled", "in_progress", "completed"].includes(status)) throw new ApiError(400, "Invalid booking status.");

  if (["provider", "driver"].includes(req.user.role)) {
    if (req.user.approvalStatus !== "approved") {
      throw new ApiError(403, "Unapproved drivers cannot accept transport bookings.");
    }
    const application = await ProviderApplication.findOne({ userId: req.user.id, status: "approved" }).select("category vehicleType");
    if (!application) throw new ApiError(403, "Only approved drivers can respond to requests.");
    const booking = await TransportBooking.findById(req.params.id).select("vehicleType");
    const category = typeToCategory[booking?.vehicleType];
    const matchesCategory = category && (category === application.category || booking?.vehicleType === application.vehicleType);
    if (!matchesCategory) throw new ApiError(403, "You are not approved for this transport category.");
    if (status === "accepted") {
      const accepted = await TransportBooking.findOneAndUpdate(
        { _id: req.params.id, status: "pending", activeProviderId: req.user.id, providerId: null, dispatchExpiresAt: { $gt: new Date() } },
        { $set: { providerId: req.user.id, status: "accepted", activeProviderId: null, dispatchExpiresAt: null } },
        { new: true }
      );
      if (!accepted) throw new ApiError(409, "This request expired or was already accepted by another driver.");
      return res.json(new ApiResponse(200, accepted, "Booking accepted and assigned to you."));
    }
    if (status === "in_progress" || status === "completed") {
      const allowedFrom = status === "in_progress" ? "accepted" : "in_progress";
      const updated = await TransportBooking.findOneAndUpdate(
        { _id: req.params.id, providerId: req.user.id, status: allowedFrom },
        { $set: { status } }, { new: true, runValidators: true }
      );
      if (!updated) throw new ApiError(409, `Trip cannot be moved to ${status} from its current status.`);
      return res.json(new ApiResponse(200, updated, status === "in_progress" ? "Trip started. Live location sharing is active while this page remains open." : "Trip completed. Live location updates have stopped."));
    }
    if (status === "rejected") {
      const declined = await TransportBooking.findOneAndUpdate(
        { _id: req.params.id, status: "pending", activeProviderId: req.user.id },
        { $addToSet: { declinedBy: req.user.id }, $set: { activeProviderId: null, dispatchExpiresAt: null } },
        { new: true }
      );
      if (!declined) throw new ApiError(409, "This request is no longer assigned to you.");
      const advanced = await dispatchNext(declined);
      const refreshed = await TransportBooking.findById(declined._id);
      return res.json(new ApiResponse(200, { booking: refreshed, nextProviderNotified: advanced }, advanced ? "Request declined. The next eligible provider has been notified." : "Request declined. No eligible providers remain; the customer can expand the search area."));
    }
    throw new ApiError(400, "Providers cannot cancel customer bookings; use Reject before acceptance or contact support after acceptance.");
  }

  if (req.user.role === "customer" && status === "cancelled") {
    const cancelled = await TransportBooking.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user.id, status: "pending" },
      { $set: { status: "cancelled", activeProviderId: null, dispatchExpiresAt: null } },
      { new: true }
    );
    if (!cancelled) throw new ApiError(409, "This request cannot be cancelled because it is no longer pending.");
    return res.json(new ApiResponse(200, cancelled, "Transport request cancelled."));
  }
  if (req.user.role === "admin") {
    const updated = await TransportBooking.findByIdAndUpdate(req.params.id, { $set: { status, ...(status === "cancelled" ? { activeProviderId: null, dispatchExpiresAt: null } : {}) } }, { new: true, runValidators: true });
    if (!updated) throw new ApiError(404, "Transport request not found.");
    return res.json(new ApiResponse(200, updated, "Transport request status updated."));
  }
  throw new ApiError(403, "You cannot update this transport request.");
});

const getNearbyDrivers = asyncHandler(async (req, res) => {
  const { latitude, longitude, vehicleType = "auto", radiusKm = 15 } = req.query;
  const category = typeToCategory[vehicleType] || "Auto";
  const origin = coords({ latitude, longitude });
  const radius = Math.min(Math.max(Number(radiusKm) || 15, 1), 50);

  // Query approved, online drivers
  const applications = await ProviderApplication.find({
    category,
    status: "approved",
    isOnline: { $ne: false }
  }).select("userId city taluk district locationCoordinates vehicleType vehicleModel").lean();

  const drivers = [];
  for (const app of applications) {
    const driverCoords = coords(app.locationCoordinates);
    let distance = null;
    if (origin && driverCoords) {
      distance = Math.round(distanceKm(origin, driverCoords) * 10) / 10;
    }
    // Filter out if origin exists and distance is beyond search radius
    if (origin && distance !== null && distance > radius) {
      continue;
    }

    // Estimate realistic ETA based on 25 km/h city average
    const etaMinutes = distance !== null ? Math.max(2, Math.round((distance / 25) * 60)) : null;

    drivers.push({
      id: String(app.userId),
      vehicleType: app.vehicleType || vehicleType,
      vehicleModel: app.vehicleModel || (vehicleType === "auto" ? "Bajaj RE Auto" : "Commercial Vehicle"),
      approximateDistanceKm: distance,
      estimatedEtaMinutes: etaMinutes,
      area: app.city || app.taluk || app.district || "Bagalkot",
      isOnline: true
    });
  }

  // Sort closest drivers first
  drivers.sort((a, b) => {
    if (a.approximateDistanceKm !== null && b.approximateDistanceKm !== null) {
      return a.approximateDistanceKm - b.approximateDistanceKm;
    }
    return 0;
  });

  return res.json(new ApiResponse(200, {
    count: drivers.length,
    drivers,
    searchRadiusKm: radius
  }, drivers.length > 0 ? "Nearby drivers found." : "No drivers are currently available nearby."));
});

module.exports = { create, mine, available, assigned, getNearbyDrivers, getMessages, sendMessage, updateStatus, updateLocation, getTracking, updateTripLocation };
