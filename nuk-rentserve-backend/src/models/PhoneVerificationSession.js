const mongoose = require("mongoose");

const phoneVerificationSessionSchema = new mongoose.Schema(
  {
    referenceHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    phoneCountryCode: {
      type: String,
      required: true,
      trim: true,
      default: "+91"
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },

    normalizedPhoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    purpose: {
      type: String,
      required: true,
      enum: [
        "customer-registration",
        "customer-login",
        "provider-registration",
        "driver-registration",
        "student-registration",
        "registration",
        "login",
        "password-reset",
        "profile-verification"
      ],
      index: true
    },

    used: {
      type: Boolean,
      default: false,
      index: true
    },

    usedAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },

    urlHash: {
      type: String,
      index: true,
      sparse: true
    },

    ipAddress: {
      type: String,
      default: ""
    },

    userAgent: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "PhoneVerificationSession",
  phoneVerificationSessionSchema
);
