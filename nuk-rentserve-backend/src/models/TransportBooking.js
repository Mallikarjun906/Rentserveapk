const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  vehicleType: { type: String, enum: ["auto", "car", "goods-van"], required: true, index: true },
  pickup: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  destination: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  scheduledAt: { type: Date, required: true, index: true },
  details: { type: String, trim: true, maxlength: 1200, default: "" },
  status: { type: String, enum: ["pending", "accepted", "in_progress", "completed", "rejected", "cancelled", "unmatched"], default: "pending", index: true },
  providerNote: { type: String, trim: true, maxlength: 500, default: "" },
  declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Sequential dispatch: one eligible provider is notified at a time.
  dispatchQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dispatchIndex: { type: Number, default: 0, min: 0 },
  activeProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  dispatchExpiresAt: { type: Date, default: null, index: true },
  pickupCoordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  destinationCoordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  liveLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0, max: 100000 },
    heading: { type: Number, min: 0, max: 360 },
    speed: { type: Number, min: 0, max: 500 },
    updatedAt: { type: Date, default: null }
  }
}, { timestamps: true });
schema.index({ vehicleType: 1, status: 1, scheduledAt: 1 });
module.exports = mongoose.model("TransportBooking", schema);
