const router = require("express").Router();
const mongoose = require("mongoose");
const ServiceListing = require("../models/ServiceListing");
const ProviderApplication = require("../models/ProviderApplication");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const esc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function shape(item) {
  return { ...item.toObject(), id: item.id, name: item.title, city: item.location, category: item.categoryId?.name || "Service", experience: item.providerId?.experienceYears ? `${item.providerId.experienceYears} years` : "Local professional", price: item.priceRange?.min != null ? `₹${item.priceRange.min}${item.priceRange.max != null && item.priceRange.max !== item.priceRange.min ? `–₹${item.priceRange.max}` : "+"}` : "Contact for price", icon: "wrench" };
}
router.get("/mine", authenticate, allowRoles("provider", "admin"), async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { providerId: req.user.id };
    const items = await ServiceListing.find(filter).populate("providerId", "name phone location").populate("categoryId", "name slug").sort({ createdAt: -1 }).limit(100);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = { status: "published" };
    const location = req.query.location || req.query.city;
    if (location) filter.location = { $regex: esc(location), $options: "i" };
    if (req.query.category) { const c = await require("../models/ServiceCategory").findOne({ name: { $regex: esc(req.query.category), $options: "i" }, isActive: true }); if (c) filter.categoryId = c._id; else return res.json(new ApiResponse(200, [])); }
    const search = req.query.search || req.query.q;
    if (search) filter.$or = [{title:{$regex:esc(search),$options:"i"}},{description:{$regex:esc(search),$options:"i"}},{location:{$regex:esc(search),$options:"i"}}];
    const items = await ServiceListing.find(filter).populate("providerId", "name phone location").populate("categoryId", "name slug").sort({createdAt:-1}).limit(50);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Service listing not found.");
    const item = await ServiceListing.findById(req.params.id).populate("providerId", "name phone location").populate("categoryId", "name slug");
    if (item && item.status === "published") {
      return res.json(new ApiResponse(200, shape(item)));
    }

    // Fallback: check ProviderApplication or User by ID
    let app = await ProviderApplication.findById(req.params.id).populate("userId", "name phone location email").lean();
    if (!app) {
      app = await ProviderApplication.findOne({ userId: req.params.id }).populate("userId", "name phone location email").lean();
    }

    if (app) {
      const u = app.userId;
      const shapedApp = {
        _id: app._id,
        id: app._id,
        name: app.fullName || u?.name || "Professional Provider",
        title: `${app.category || "Professional"} Service`,
        city: app.city || u?.location || "Bagalkot",
        location: app.city || u?.location || "Bagalkot",
        category: app.category || "Service",
        categoryId: { name: app.category || "Service", slug: "service" },
        experience: app.experience ? `${app.experience} years` : "Local professional",
        price: app.price || "₹350/visit",
        priceRange: { min: 350, max: 1200 },
        payUnit: "visit",
        description: app.description || "Local verified professional service",
        providerId: {
          _id: u?._id || app.userId,
          name: app.fullName || u?.name || "Professional Provider",
          phone: app.phone || u?.phone,
        },
        icon: "wrench",
        availability: true,
        status: "published"
      };
      return res.json(new ApiResponse(200, shapedApp));
    }

    throw new ApiError(404, "Service listing not found.");
  } catch (e) { next(e); }
});
module.exports = router;
