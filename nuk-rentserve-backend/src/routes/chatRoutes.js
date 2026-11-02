const router = require("express").Router();
const controller = require("../controllers/chatController");
const { authenticate } = require("../middleware/authMiddleware");

// All chat endpoints strictly require authentication
router.use(authenticate);

router.get("/conversations", controller.getConversations);
router.get("/:bookingId/messages", controller.getMessages);
router.post("/:bookingId/messages", controller.sendMessage);

module.exports = router;
