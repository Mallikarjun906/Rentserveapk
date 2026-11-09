
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 25,
      default: ""
    },

    profileImage: {
      url: {
        type: String,
        default: ""
      },
      publicId: {
        type: String,
        default: ""
      }
    },

    // Password is required for traditional accounts,
    // but Google accounts can authenticate without one.
    password: {
      type: String,
      required: false,
      select: false
    },

    role: {
      type: String,
      enum: ["customer", "owner", "provider", "driver", "student", "admin"],
      default: "customer",
      index: true
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: function () {
        return ["provider", "driver", "student"].includes(this.role)
          ? "pending"
          : "approved";
      },
      index: true
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    suspendedReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "Bagalkot"
    },

    isOnline: {
      type: Boolean,
      default: true,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    refreshTokenHash: {
      type: String,
      select: false,
      default: undefined
    },

    // Google account identifier; absent for regular accounts.
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    // Isolated demo testing account flag
    isDemo: {
      type: Boolean,
      default: false,
      index: true
    },

    pushTokens: {
      type: [String],
      default: []
    },

    notificationPreferences: {
      rideNotifications: { type: Boolean, default: true },
      bookingNotifications: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true },
      enquiryNotifications: { type: Boolean, default: true },
      rentalNotifications: { type: Boolean, default: true },
      promoNotifications: { type: Boolean, default: false },
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
