const mongoose = require("mongoose");

const docSubschema = {
  publicId: { type: String, default: "" },
  url: { type: String, default: "" },
  resourceType: { type: String, enum: ["image", "raw", ""], default: "" },
  mimeType: { type: String, enum: ["image/jpeg", "image/png", "application/pdf", ""], default: "" },
  uploadedAt: { type: Date, default: null },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: "" }
};

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  applicationType: {
    type: String,
    enum: ["provider", "driver", "student"],
    default: "provider",
    index: true
  },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  // Date of birth is collected by application forms and retained for age-eligibility review.
  dob: { type: Date, default: () => new Date("2000-01-01"), index: true },
  address: { type: String, trim: true, maxlength: 300, default: "" },
  serviceArea: { type: String, trim: true, maxlength: 200, default: "" },
  // Optional GPS coordinates used for proximity-aware dispatch when collected with consent.
  locationCoordinates: { latitude: { type: Number, min: -90, max: 90 }, longitude: { type: Number, min: -180, max: 180 } },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  city: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
  taluk: { type: String, trim: true, maxlength: 100, default: "", index: true },
  district: { type: String, trim: true, maxlength: 100, default: "", index: true },
  
  // Profile photo
  profileImage: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" }
  },

  // Vehicle Images (for transport / driver)
  vehicleImages: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],

  // Provider specific
  category: { type: String, trim: true, maxlength: 80, default: "General Service" },
  experience: { type: String, trim: true, maxlength: 80, default: "" },
  price: { type: String, trim: true, maxlength: 100, default: "" },
  description: { type: String, trim: true, maxlength: 3000, default: "" },
  consent: { type: Boolean, required: true, default: false },

  // Driver specific
  drivingLicenceNumber: { type: String, trim: true, maxlength: 50, default: "" },
  drivingLicenceDocument: docSubschema,
  vehicleType: { type: String, trim: true, enum: ["auto", "car", "goods-van", "Auto", "Passenger car", "Goods van", ""], default: "" },
  vehicleRegistrationNumber: { type: String, trim: true, maxlength: 30, default: "" },
  vehicleRcDocument: docSubschema,

  // Student specific
  collegeName: { type: String, trim: true, maxlength: 200, default: "" },
  studentIdNumber: { type: String, trim: true, maxlength: 50, default: "" },
  studentIdCardDocument: docSubschema,

  // General documents
  aadhaarDocument: docSubschema,
  addressProofDocument: docSubschema,

  // Verification & Status
  status: { type: String, enum: ["pending", "info", "approved", "rejected"], default: "pending", index: true },
  reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: "" },

  documentVerificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  documentRejectionReason: { type: String, trim: true, maxlength: 500, default: "" },
  resubmittedAt: { type: Date, default: null },

  identityReviewStatus: { type: String, enum: ["not_checked", "match", "possible_mismatch", "manual_review_required"], default: "not_checked" },
  aadhaarName: { type: String, trim: true, maxlength: 100, default: "" },
  identityReviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  identityReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  identityReviewedAt: { type: Date, default: null },
  isDemo: { type: Boolean, default: false, index: true }
}, { timestamps: true });

schema.pre("validate", function(next) {
  const driverCategories = ["Auto", "Passenger car", "Goods van"];
  if (this.applicationType === "provider" && driverCategories.includes(this.category) && (!Array.isArray(this.vehicleImages) || this.vehicleImages.length < 1)) {
    this.invalidate("vehicleImages", "At least one vehicle photo is required for driver applications.");
  }
  if (Array.isArray(this.vehicleImages) && this.vehicleImages.length > 5) {
    this.invalidate("vehicleImages", "Maximum five vehicle photos are allowed.");
  }
  next();
});

module.exports = mongoose.model("ProviderApplication", schema);
