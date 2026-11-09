const router = require("express").Router();
const controller = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(authenticate);

router.get("/", controller.listNotifications);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
router.delete("/:id", controller.deleteNotification);

router.post("/device-token", controller.registerDeviceToken);
router.get("/preferences", controller.getPreferences);
router.patch("/preferences", controller.updatePreferences);

// Admin Broadcast Route
router.post("/broadcast", allowRoles("admin"), controller.broadcastNotification);

module.exports = router;
