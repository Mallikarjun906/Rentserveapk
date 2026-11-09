const router = require("express").Router();
const controller = require("../controllers/propertyController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { uploadListingImages } = require("../middleware/uploadMiddleware");

router.get("/", controller.listProperties);
router.get("/mine", authenticate, controller.getMyProperties);
router.get("/:id", controller.getProperty);
router.post("/", authenticate, allowRoles("owner", "student", "admin"), uploadListingImages, controller.createProperty);
router.patch("/:id", authenticate, allowRoles("owner", "student", "admin"), uploadListingImages, controller.updateProperty);
router.delete("/:id", authenticate, allowRoles("owner", "student", "admin"), controller.deleteProperty);
router.delete("/:id/images/:imageId", authenticate, allowRoles("owner", "student", "admin"), controller.deletePropertyImage);

module.exports = router;
