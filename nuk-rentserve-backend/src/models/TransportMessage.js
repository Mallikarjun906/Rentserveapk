const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportBooking", required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  readAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ bookingId: 1, createdAt: 1 });
module.exports = mongoose.model("TransportMessage", schema);
