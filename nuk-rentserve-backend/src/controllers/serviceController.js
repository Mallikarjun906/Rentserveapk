const mongoose = require("mongoose");
const ServiceListing = require("../models/ServiceListing");
const ServiceCategory = require("../models/ServiceCategory");
const ServiceProvider = require("../models/ServiceProvider");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { filesToImageRecords, deleteCloudinaryImages } = require("../services/imageService");

const listServices = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { status: "published" };
  if (req.query.location) filter.location = { $regex: String(req.query.location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (req.query.categoryId && mongoose.isValidObjectId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
  if (req.query.category && String(req.query.category).trim()) {
    const needle = String(req.query.category).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const category = await ServiceCategory.findOne({ isActive: true, $or: [{ name: { $regex: needle, $options: "i" } }, { slug: { $regex: needle, $options: "i" } }] }).select("_id");
    if (!category) return res.json(new ApiResponse(200, { items: [], pagination: { page, limit, total: 0, pages: 0 } }));
    filter.categoryId = category._id;
  }
  if (req.query.available === "true") filter.availability = true;
  if (req.query.search) {
    const term = String(req.query.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (term) filter.$or = [
      { title: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { location: { $regex: term, $options: "i" } }
    ];
  }
  const [items, total] = await Promise.all([
    ServiceListing.find(filter).populate("providerId", "name location").populate("categoryId", "name slug")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ServiceListing.countDocuments(filter)
  ]);
  res.json(new ApiResponse(200, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

const getService = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findById(req.params.id).populate("providerId", "name location").populate("categoryId", "name slug");
  if (!item || (item.status !== "published" && item.providerId?._id.toString() !== req.user?.id && req.user?.role !== "admin")) {
    throw new ApiError(404, "Service listing not found.");
  }
  res.json(new ApiResponse(200, item));
});

const createService = asyncHandler(async (req, res) => {
  const { categoryId, title, description, location, priceRange, payUnit, workHours } = req.body;
  if (!categoryId || !title || !description || !location || priceRange == null) throw new ApiError(400, "categoryId, title, description, location and priceRange are required.");
  if (!mongoose.isValidObjectId(categoryId)) throw new ApiError(400, "Invalid categoryId.");
  const category = await ServiceCategory.findOne({ _id: categoryId, isActive: true });
  if (!category) throw new ApiError(400, "Active service category not found.");
  let parsedPrice = priceRange;
  if (typeof priceRange === "string") {
    try { parsedPrice = JSON.parse(priceRange); } catch { throw new ApiError(400, "priceRange must be JSON with min and max."); }
  }
  const images = filesToImageRecords(req.files);
  const profile = await ServiceProvider.findOne({ userId: req.user.id }).select("verificationStatus");
  const isApproved = req.user.role === "admin" || (req.user.approvalStatus === "approved" && profile?.verificationStatus === "verified");
  const requestedStatus = req.body.status || "published";
  if (requestedStatus === "published" && !isApproved) {
    throw new ApiError(403, "Unapproved providers cannot publish services.");
  }
  const status = isApproved ? "published" : "draft";
  const item = await ServiceListing.create({
    providerId: req.user.id, categoryId, title, description, location, priceRange: parsedPrice,
    payUnit, workHours, images, status
  });
  res.status(201).json(new ApiResponse(201, item, "Service listing created."));
});

const updateService = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findById(req.params.id);
  if (!item) throw new ApiError(404, "Service listing not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this listing.");
  if (req.user.role !== "admin" && req.body.status === "published") {
    const profile = await ServiceProvider.findOne({ userId: req.user.id }).select("verificationStatus");
    if (profile?.verificationStatus !== "verified") throw new ApiError(403, "Your provider account must be verified before publishing listings.");
  }
  const allowed = ["categoryId", "title", "description", "location", "priceRange", "payUnit", "workHours", "availability", "status"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "priceRange" && typeof req.body[key] === "string") {
        try { item[key] = JSON.parse(req.body[key]); } catch { throw new ApiError(400, "priceRange must be valid JSON."); }
      } else item[key] = req.body[key];
    }
  }
  if (req.files?.length) item.images.push(...filesToImageRecords(req.files));
  if (item.images.length > 8) throw new ApiError(400, "Maximum 8 images per listing.");
  await item.save();
  res.json(new ApiResponse(200, item, "Service listing updated."));
});

const deleteService = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findById(req.params.id);
  if (!item) throw new ApiError(404, "Service listing not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot delete this listing.");
  await deleteCloudinaryImages(item.images);
  await item.deleteOne();
  res.json(new ApiResponse(200, null, "Service listing deleted."));
});

const deleteServiceImage = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findById(req.params.id);
  if (!item) throw new ApiError(404, "Service listing not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this listing.");
  const image = item.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, "Image not found.");
  await deleteCloudinaryImages([image]);
  image.deleteOne();
  await item.save();
  res.json(new ApiResponse(200, item, "Image deleted."));
});

module.exports = { listServices, getService, createService, updateService, deleteService, deleteServiceImage };
