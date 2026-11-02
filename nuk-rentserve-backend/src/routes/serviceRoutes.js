const router = require("express").Router();
const controller = require("../controllers/serviceController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles, requireApproval } = require("../middleware/roleMiddleware");
const { uploadListingImages } = require("../middleware/uploadMiddleware");

router.get("/", controller.listServices);
router.get("/:id", controller.getService);
router.post("/", authenticate, allowRoles("admin", "provider"), requireApproval, uploadListingImages, controller.createService);
router.patch("/:id", authenticate, allowRoles("admin", "provider"), requireApproval, uploadListingImages, controller.updateService);
router.delete("/:id", authenticate, allowRoles("admin", "provider"), requireApproval, controller.deleteService);
router.delete("/:id/images/:imageId", authenticate, allowRoles("admin", "provider"), requireApproval, controller.deleteServiceImage);

module.exports = router;
