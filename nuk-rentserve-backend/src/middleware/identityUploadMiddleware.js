const multer = require("multer");
const ApiError = require("../utils/ApiError");

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 40, parts: 50 },
  fileFilter: (_req, file, cb) => {
    const docFields = [
      "aadhaarDocument",
      "govtIdDocument",
      "addressProofDocument",
      "drivingLicenceDocument",
      "vehicleRcDocument",
      "studentIdCardDocument",
      "file",
      "document"
    ];

    if (docFields.includes(file.fieldname)) {
      if (!allowedTypes.has(file.mimetype)) {
        return cb(new ApiError(400, "Documents must be JPG, PNG, or PDF format (max 5 MB)."));
      }
    } else if (["profileImage", "vehicleImages"].includes(file.fieldname)) {
      if (!imageTypes.has(file.mimetype)) {
        return cb(new ApiError(400, "Photos must be JPG, PNG, or WebP format (max 5 MB each)."));
      }
    } else {
      return cb(new ApiError(400, `Unexpected upload field: ${file.fieldname}`));
    }
    cb(null, true);
  }
});

function uploadRegistrationFiles(req, res, next) {
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "aadhaarDocument", maxCount: 1 },
    { name: "govtIdDocument", maxCount: 1 },
    { name: "addressProofDocument", maxCount: 1 },
    { name: "drivingLicenceDocument", maxCount: 1 },
    { name: "vehicleRcDocument", maxCount: 1 },
    { name: "studentIdCardDocument", maxCount: 1 },
    { name: "vehicleImages", maxCount: 5 },
    { name: "document", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ])(req, res, (err) => (err ? next(err) : next()));
}

module.exports = {
  uploadAadhaarDocument: uploadRegistrationFiles,
  uploadProviderApplicationFiles: uploadRegistrationFiles,
  uploadRegistrationFiles
};
