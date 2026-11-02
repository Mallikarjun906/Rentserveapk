const router = require("express").Router();
const controller = require("../controllers/transportBookingController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles, requireApproval } = require("../middleware/roleMiddleware");

router.use(authenticate);

// Customer bookings
router.post("/", allowRoles("customer", "owner"), controller.create);
router.get("/mine", allowRoles("customer", "owner"), controller.mine);

// Driver transport queues & location updates (strictly require approved driver/provider)
router.get("/available", allowRoles("driver", "provider"), requireApproval, controller.available);
router.get("/assigned", allowRoles("driver", "provider"), requireApproval, controller.assigned);
router.patch("/location", allowRoles("driver", "provider"), requireApproval, controller.updateLocation);
router.patch("/:id/location", allowRoles("driver", "provider"), requireApproval, controller.updateTripLocation);

// Trip tracking, chat and status updates
router.get("/:id/tracking", allowRoles("driver", "provider", "customer", "admin"), controller.getTracking);
router.get("/:id/messages", allowRoles("driver", "provider", "customer"), controller.getMessages);
router.post("/:id/messages", allowRoles("driver", "provider", "customer"), controller.sendMessage);
router.patch("/:id/status", allowRoles("driver", "provider", "customer", "admin"), controller.updateStatus);

module.exports = router;
