const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const ServiceListing = require("../models/ServiceListing");
const ProviderApplication = require("../models/ProviderApplication");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { notifyUser } = require("../services/notificationService");

const esc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const create = asyncHandler(async (req, res) => {
  const {
    propertyId,
    serviceId,
    providerId,
    bookingType = propertyId ? "property" : "service",
    category,
    serviceCategory,
    location,
    scheduledDate,
    requestedMoveInDate,
    message = "",
    details = "",
    locationCoordinates
  } = req.body;

  // 1. Service Booking Request
  if (bookingType === "service" || serviceId || providerId || category || serviceCategory) {
    const rawCategory = String(category || serviceCategory || "").trim();
    const finalLocation = String(location || req.user.location || "Bagalkot").trim();
    const finalMsg = String(message || details || "").trim();

    let targetProviderId = null;
    let eligibleProviders = [];
    let resolvedService = null;
    let inheritedCategory = "";

    // 1A. Direct providerId resolution (User ID, ProviderApplication ID, or ServiceProvider ID)
    if (providerId && mongoose.isValidObjectId(providerId)) {
      const pUser = await User.findById(providerId).select("_id role approvalStatus name location");
      if (pUser && (pUser.role === "provider" || pUser.role === "admin")) {
        targetProviderId = pUser._id;
        const app = await ProviderApplication.findOne({ userId: pUser._id, applicationType: "provider" }).select("category");
        if (app?.category) inheritedCategory = app.category;
      } else {
        let app = await ProviderApplication.findById(providerId).select("userId category status");
        if (!app) {
          app = await ProviderApplication.findOne({ userId: providerId }).select("userId category status");
        }
        if (app?.userId) {
          targetProviderId = app.userId;
          if (app.category) inheritedCategory = app.category;
        } else if (pUser) {
          targetProviderId = pUser._id;
        } else {
          const sp = await ServiceProvider.findById(providerId).select("userId");
          if (sp?.userId) {
            targetProviderId = sp.userId;
          }
        }
      }

      if (targetProviderId) {
        if (targetProviderId.toString() === req.user.id) {
          throw new ApiError(400, "You cannot send a booking request to yourself.");
        }
        eligibleProviders = [targetProviderId];
      }
    }

    // 1B. ServiceId resolution
    if (serviceId && mongoose.isValidObjectId(serviceId)) {
      resolvedService = await ServiceListing.findById(serviceId).populate("providerId");
      if (resolvedService) {
        const svcProvId = resolvedService.providerId?._id || resolvedService.providerId;
        if (!targetProviderId && svcProvId) {
          targetProviderId = svcProvId;
          if (targetProviderId.toString() === req.user.id) {
            throw new ApiError(400, "You cannot book your own service listing.");
          }
          eligibleProviders = [targetProviderId];
        }
        if (resolvedService.title) inheritedCategory = resolvedService.title;
      } else if (!targetProviderId) {
        // Fallback: check if serviceId was sent with a ProviderApplication ID
        const app = await ProviderApplication.findById(serviceId).select("userId category");
        if (app?.userId) {
          targetProviderId = app.userId;
          if (targetProviderId.toString() === req.user.id) {
            throw new ApiError(400, "You cannot send a booking request to yourself.");
          }
          eligibleProviders = [targetProviderId];
          if (app.category) inheritedCategory = app.category;
        }
      }
    }

    const finalCategory =
      (rawCategory && rawCategory !== "General Service" && rawCategory !== "Professional Service" ? rawCategory : "") ||
      inheritedCategory ||
      rawCategory ||
      "Professional Service";

    // 1C. If no direct provider was specified, broadcast to matching approved providers in category/city
    if (eligibleProviders.length === 0 && finalCategory) {
      const catRegex = new RegExp(esc(finalCategory), "i");
      const matchedApps = await ProviderApplication.find({
        applicationType: "provider",
        status: "approved",
        category: catRegex
      }).select("userId city taluk district serviceArea locationCoordinates").lean();

      eligibleProviders = matchedApps.map((a) => a.userId).filter(Boolean);

      // Fallback: match approved providers in user's city
      if (eligibleProviders.length === 0) {
        const cityRegex = new RegExp(esc(finalLocation), "i");
        const localProviders = await User.find({
          role: "provider",
          approvalStatus: "approved",
          location: cityRegex
        }).select("_id").limit(10);
        eligibleProviders = localProviders.map((u) => u._id);
      }
    }

    // 1D. Scoped duplicate check: prevents duplicate active bookings for the SAME provider or service
    const duplicateQuery = {
      customerId: req.user.id,
      bookingType: "service",
      status: { $in: ["pending", "accepted", "in_progress"] },
    };

    if (targetProviderId) {
      duplicateQuery.providerId = targetProviderId;
    } else if (resolvedService?._id) {
      duplicateQuery.serviceId = resolvedService._id;
    } else if (finalCategory && finalCategory !== "Professional Service") {
      duplicateQuery.category = finalCategory;
    }

    const duplicate = await Booking.findOne(duplicateQuery).select("_id status category createdAt");

    if (duplicate) {
      return res.status(409).json(
        new ApiResponse(
          409,
          {
            existingBookingId: duplicate._id,
            status: duplicate.status,
            category: duplicate.category,
            createdAt: duplicate.createdAt,
          },
          "You already have an active service request with this provider. Please wait for provider confirmation."
        )
      );
    }

    let parsedScheduledDate = null;
    let scheduledNote = "";
    if (scheduledDate) {
      const parsed = new Date(scheduledDate);
      if (!Number.isNaN(parsed.getTime())) {
        parsedScheduledDate = parsed;
      } else {
        scheduledNote = ` [Scheduled: ${scheduledDate}]`;
      }
    }

    const finalCombinedMsg = (finalMsg || "") + scheduledNote;

    const booking = await Booking.create({
      customerId: req.user.id,
      providerId: targetProviderId,
      serviceId: resolvedService?._id || null,
      bookingType: "service",
      category: finalCategory,
      serviceCategory: finalCategory,
      location: finalLocation,
      locationCoordinates: locationCoordinates || undefined,
      scheduledDate: parsedScheduledDate,
      message: finalCombinedMsg,
      details: finalCombinedMsg,
      status: "pending",
      eligibleProviders
    });

    // Notify eligible providers
    for (const pId of eligibleProviders) {
      try {
        const pUser = await User.findById(pId).select("name email");
        if (pUser) {
          notifyUser(
            pUser,
            "New Customer Service Request",
            `Hello ${pUser.name}, a customer in ${finalLocation} submitted a service request for ${booking.category}. Open NUK RentServe to review and accept.`
          );
        }
      } catch {}
    }

    return res.status(201).json(
      new ApiResponse(201, booking, "Service request submitted and delivered to available providers.")
    );
  }

  // 2. Rental Property Booking Request
  if (!propertyId || !mongoose.isValidObjectId(propertyId)) {
    throw new ApiError(400, "Choose a valid rental property or specify service details.");
  }
  const property = await Property.findOne({ _id: propertyId, status: "published", availability: true });
  if (!property) throw new ApiError(404, "This property is not available for booking.");
  if (property.ownerId.toString() === req.user.id) throw new ApiError(400, "You cannot book your own property.");
  if (requestedMoveInDate && Number.isNaN(new Date(requestedMoveInDate).getTime())) {
    throw new ApiError(400, "Enter a valid move-in date.");
  }

  const booking = await Booking.create({
    customerId: req.user.id,
    ownerId: property.ownerId,
    propertyId: property._id,
    bookingType: "property",
    requestedMoveInDate: requestedMoveInDate || null,
    message: String(message).trim()
  });

  return res.status(201).json(new ApiResponse(201, booking, "Booking request sent to the property owner."));
});

const mine = asyncHandler(async (req, res) => {
  const filter = req.user.role === "provider"
    ? { providerId: req.user.id }
    : { customerId: req.user.id };

  const items = await Booking.find(filter)
    .populate("propertyId")
    .populate("serviceId")
    .populate("ownerId", "name phone email")
    .populate("providerId", "name phone email")
    .populate("customerId", "name phone email")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(new ApiResponse(200, items));
});

const received = asyncHandler(async (req, res) => {
  let filter;
  if (req.user.role === "admin") {
    filter = {};
  } else if (req.user.role === "provider") {
    filter = {
      bookingType: "service",
      $or: [
        { providerId: req.user.id },
        { eligibleProviders: req.user.id }
      ],
      rejectedBy: { $ne: req.user.id }
    };
  } else {
    filter = { ownerId: req.user.id };
  }

  const items = await Booking.find(filter)
    .populate("propertyId")
    .populate("serviceId")
    .populate("customerId", "name phone email location")
    .populate("providerId", "name phone email")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(new ApiResponse(200, items));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, reason = "" } = req.body;
  if (!["accepted", "rejected", "cancelled", "completed", "in_progress"].includes(status)) {
    throw new ApiError(400, "Status must be accepted, rejected, cancelled, in_progress, or completed.");
  }

  const booking = await Booking.findById(req.params.id)
    .populate("customerId", "name email phone")
    .populate("providerId", "name email phone")
    .populate("ownerId", "name email phone");

  if (!booking) throw new ApiError(404, "Booking request not found.");

  const isOwner = booking.ownerId && booking.ownerId._id?.toString() === req.user.id;
  const isCustomer = booking.customerId && booking.customerId._id?.toString() === req.user.id;
  const isDirectProvider = booking.providerId && booking.providerId._id?.toString() === req.user.id;
  const isEligibleProvider = booking.eligibleProviders?.some((p) => p.toString() === req.user.id);
  const isAuthorized = isOwner || isDirectProvider || isEligibleProvider || isCustomer || req.user.role === "admin";

  if (!isAuthorized) {
    throw new ApiError(403, "You are not authorized to update this booking request.");
  }

  if (status === "cancelled") {
    if (!isCustomer && req.user.role !== "admin") {
      throw new ApiError(403, "Only the customer can cancel their request.");
    }
    booking.status = "cancelled";
    await booking.save();
    return res.json(new ApiResponse(200, booking, "Booking cancelled."));
  }

  if (status === "accepted") {
    if (req.user.role === "provider" && req.user.approvalStatus !== "approved") {
      throw new ApiError(403, "Unapproved providers cannot accept bookings.");
    }

    // Strict duplicate acceptance prevention
    if (booking.status !== "pending") {
      throw new ApiError(409, "This request has already been accepted or processed.");
    }

    booking.status = "accepted";
    if (req.user.role === "provider") {
      booking.providerId = req.user.id;
    }
    await booking.save();

    // Notify customer
    if (booking.customerId?.email) {
      notifyUser(
        booking.customerId,
        "Service Request Confirmed",
        `Your request for ${booking.category || "service"} was accepted by ${req.user.name}. You can now chat in the NUK RentServe app.`
      );
    }

    return res.json(new ApiResponse(200, booking, "Booking request accepted successfully."));
  }

  if (status === "rejected") {
    if (req.user.role === "provider") {
      if (!booking.rejectedBy.includes(req.user.id)) {
        booking.rejectedBy.push(req.user.id);
      }
      if (booking.providerId && booking.providerId._id?.toString() === req.user.id) {
        booking.status = "rejected";
        booking.rejectionReason = String(reason || "Provider unavailable").trim();
      } else if (booking.eligibleProviders.length > 0 && booking.rejectedBy.length >= booking.eligibleProviders.length) {
        booking.status = "rejected";
        booking.rejectionReason = String(reason || "All eligible providers declined").trim();
      }
      await booking.save();
      return res.json(new ApiResponse(200, booking, "Request declined."));
    }

    booking.status = "rejected";
    booking.rejectionReason = String(reason || "Declined by owner").trim();
    await booking.save();
    return res.json(new ApiResponse(200, booking, "Booking rejected."));
  }

  if (status === "in_progress") {
    if (booking.status !== "accepted") {
      throw new ApiError(400, "Only accepted bookings can be started.");
    }
    booking.status = "in_progress";
    await booking.save();
    return res.json(new ApiResponse(200, booking, "Job started. Please coordinate with the customer."));
  }

  if (status === "completed") {
    if (!["accepted", "in_progress"].includes(booking.status)) {
      throw new ApiError(400, "Only active bookings can be completed.");
    }
    booking.status = "completed";
    await booking.save();
    return res.json(new ApiResponse(200, booking, "Job marked as completed. Earnings record updated."));
  }

  booking.status = status;
  await booking.save();
  return res.json(new ApiResponse(200, booking, "Booking status updated."));
});

module.exports = { create, mine, received, updateStatus };
