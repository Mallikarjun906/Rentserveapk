const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

const PRIVATE_DIR = path.join(__dirname, "../../uploads/private_documents");
const PUBLIC_DIR = path.join(__dirname, "../../uploads/public_images");

// Ensure directories exist for local fallback
try {
  if (!fs.existsSync(PRIVATE_DIR)) fs.mkdirSync(PRIVATE_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
} catch (e) {
  console.warn("Could not create local upload directories:", e.message);
}

function maskIdentifier(idStr) {
  if (!idStr) return "";
  const clean = String(idStr).replace(/\s+/g, "");
  if (clean.length <= 4) return "****";
  const visible = clean.slice(-4);
  const maskedPrefix = clean.slice(0, -4).replace(/./g, "X");
  // Group nicely if 12 digits (like Aadhaar)
  if (clean.length === 12) {
    return "XXXX-XXXX-" + visible;
  }
  return maskedPrefix + visible;
}

async function uploadPublicImage(file) {
  if (!file || !file.buffer) throw new ApiError(400, "Missing image file.");
  
  if (cloudinaryConfigured) {
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "nuk-rentserve/public-images",
            resource_type: "image",
            use_filename: false,
            unique_filename: true
          },
          (error, result) => (error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id }))
        ).end(file.buffer);
      });
    } catch (cErr) {
      console.warn("Cloudinary public image upload failed, falling back to local storage:", cErr.message);
    }
  }

  // Local fallback
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname || ".jpg")}`;
  const filepath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);
  return {
    url: `/uploads/public/${filename}`,
    publicId: `local-${filename}`
  };
}

async function uploadPrivateDocument(file, docType = "document") {
  if (!file || !file.buffer) throw new ApiError(400, "Missing document file.");
  const isPdf = file.mimetype === "application/pdf";
  const resourceType = isPdf ? "raw" : "image";

  if (cloudinaryConfigured) {
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `nuk-rentserve/private-${docType}`,
            resource_type: resourceType,
            type: "authenticated",
            access_mode: "authenticated",
            use_filename: false,
            unique_filename: true
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              publicId: result.public_id,
              resourceType,
              mimeType: file.mimetype,
              uploadedAt: new Date(),
              url: "" // NEVER expose raw cloud URL directly in public responses
            });
          }
        ).end(file.buffer);
      });
    } catch (cErr) {
      console.warn("Cloudinary private document upload failed, falling back to local private storage:", cErr.message);
    }
  }

  // Local fallback in secure directory outside public web root
  const filename = `doc-${Date.now()}-${crypto.randomBytes(12).toString("hex")}${path.extname(file.originalname || (isPdf ? ".pdf" : ".jpg"))}`;
  const filepath = path.join(PRIVATE_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);

  return {
    publicId: `local-${filename}`,
    resourceType,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
    url: "" // Private
  };
}

module.exports = {
  maskIdentifier,
  uploadPublicImage,
  uploadPrivateDocument,
  PRIVATE_DIR
};
