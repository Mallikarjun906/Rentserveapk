const router = require("express").Router();
const controller = require("../controllers/adminController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// All admin routes strictly require authentication and admin role
router.use(authenticate, allowRoles("admin"));

// 1. Stats Overview
router.get("/stats", controller.dashboardStats);

// 2. Applications (Provider, Driver, Student)
router.get("/applications", controller.listApplications);
router.get("/provider-applications", controller.listProviderApplications);
router.patch("/applications/:id", controller.decideApplication);
router.patch("/provider-applications/:id", controller.decideProviderApplication);

// 3. Document Verification & Identity Review
router.get("/applications/:id/document", controller.viewApplicationDocument);
router.get("/applications/:id/document/:docType", controller.viewApplicationDocument);
router.get("/provider-applications/:id/document", controller.viewApplicationDocument);
router.patch("/provider-applications/:id/identity-review", controller.reviewIdentity);

// 4. User Management & Account Suspension
router.get("/users", controller.listUsers);
router.patch("/users/:id/status", controller.setUserStatus);
router.patch("/users/:id/suspend", controller.suspendUser);

// 5. Activity & Audit Logs
router.get("/audit-logs", controller.listAuditLogs);

module.exports = router;
