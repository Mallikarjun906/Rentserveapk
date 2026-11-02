const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true
    },
    adminName: {
      type: String,
      trim: true,
      default: ""
    },
    adminEmail: {
      type: String,
      trim: true,
      default: ""
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    targetUserEmail: {
      type: String,
      trim: true,
      default: ""
    },
    targetRole: {
      type: String,
      trim: true,
      default: ""
    },
    details: {
      type: String,
      trim: true,
      default: ""
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
