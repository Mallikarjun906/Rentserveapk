const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
  category: { type: String, required: true, enum: ["account", "application", "booking", "payment", "technical", "other"], default: "other" },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
  adminNote: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("SupportTicket", schema);
