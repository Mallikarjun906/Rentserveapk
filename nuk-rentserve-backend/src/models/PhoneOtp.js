const mongoose = require("mongoose");

const phoneOtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true
    },

    phoneCountryCode: {
      type: String,
      required: true,
      trim: true,
      default: "+91"
    },

    normalizedPhoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    otpHash: {
      type: String,
      required: true
    },

    purpose: {
      type: String,
      required: true,
      default: "registration",
      enum: [
        "registration",
        "customer-registration",
        "provider-registration",
        "driver-registration",
        "student-registration",
        "login",
        "customer-login",
        "provider-login",
        "driver-login",
        "password-reset",
        "profile-verification"
      ],
      index: true
    },

    role: {
      type: String,
      enum: ["customer", "provider", "driver", "student", "owner", "any"],
      default: "any"
    },

    attempts: {
      type: Number,
      default: 0
    },

    maxAttempts: {
      type: Number,
      default: 5
    },

    verified: {
      type: Boolean,
      default: false,
      index: true
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    lastSentAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
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

module.exports = mongoose.model("PhoneOtp", phoneOtpSchema);
