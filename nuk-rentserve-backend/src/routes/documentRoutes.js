const router = require("express").Router();
const registrationController = require("../controllers/registrationController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadRegistrationFiles } = require("../middleware/identityUploadMiddleware");

router.use(authenticate);

// Get current user's own application details
router.get("/my-application", registrationController.getMyApplication);

// Secure view for user's own documents
router.get("/mine/:docType", registrationController.viewMyDocument);

// Allow users to resubmit rejected documents
router.post("/resubmit", uploadRegistrationFiles, registrationController.resubmitDocuments);

// Secure private document view (admin or document owner only)
router.get("/:applicationId/:docType", registrationController.viewPrivateDocument);

module.exports = router;
