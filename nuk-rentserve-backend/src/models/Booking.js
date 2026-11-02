const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceListing", default: null, index: true },
  bookingType: { type: String, enum: ["property", "service"], default: "property", index: true },
  category: { type: String, trim: true, default: "" },
  serviceCategory: { type: String, trim: true, default: "" },
  location: { type: String, trim: true, default: "" },
  locationCoordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  scheduledDate: { type: Date, default: null },
  requestedMoveInDate: { type: Date, default: null },
  message: { type: String, trim: true, maxlength: 1500, default: "" },
  details: { type: String, trim: true, maxlength: 2000, default: "" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
    default: "pending",
    index: true
  },
  rejectionReason: { type: String, trim: true, default: "" },
  eligibleProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

bookingSchema.index({ customerId: 1, propertyId: 1, status: 1 });
bookingSchema.index({ customerId: 1, serviceId: 1, status: 1 });
bookingSchema.index({ eligibleProviders: 1, status: 1 });
bookingSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
