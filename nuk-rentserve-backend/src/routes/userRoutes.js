const router = require("express").Router();
const controller = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadRegistrationFiles } = require("../middleware/identityUploadMiddleware");

router.get("/me", authenticate, controller.getMe);
router.patch("/me", authenticate, uploadRegistrationFiles, controller.updateMe);
router.post("/me/photo", authenticate, uploadRegistrationFiles, controller.updateProfilePhoto);

module.exports = router;
