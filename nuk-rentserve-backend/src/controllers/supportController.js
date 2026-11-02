const SupportTicket = require("../models/SupportTicket");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const subject = String(req.body.subject || "").trim();
  const category = String(req.body.category || "other");
  const message = String(req.body.message || "").trim();
  if (subject.length < 3 || subject.length > 160) throw new ApiError(400, "Subject must be between 3 and 160 characters.");
  if (!['account', 'application', 'booking', 'payment', 'technical', 'other'].includes(category)) throw new ApiError(400, "Choose a valid support category.");
  if (message.length < 10 || message.length > 3000) throw new ApiError(400, "Message must be between 10 and 3000 characters.");
  const ticket = await SupportTicket.create({ userId: req.user.id, subject, category, message });
  res.status(201).json(new ApiResponse(201, ticket, "Support request submitted."));
});

const mine = asyncHandler(async (req, res) => {
  const items = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const listAll = asyncHandler(async (req, res) => {
  const items = await SupportTicket.find().populate("userId", "name email phone role").sort({ createdAt: -1 }).limit(200);
  res.json(new ApiResponse(200, items));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminNote = "" } = req.body;
  if (!["open", "in_progress", "resolved", "closed"].includes(status)) throw new ApiError(400, "Invalid support ticket status.");
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status, adminNote: String(adminNote).trim().slice(0, 1000) }, { new: true, runValidators: true });
  if (!ticket) throw new ApiError(404, "Support request not found.");
  res.json(new ApiResponse(200, ticket, "Support request updated."));
});

module.exports = { create, mine, listAll, updateStatus };
