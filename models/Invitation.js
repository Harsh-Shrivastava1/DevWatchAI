const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    role: {
      type: String,
      enum: ["admin", "developer", "viewer"],
      default: "developer"
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired", "cancelled"],
      default: "pending",
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    acceptedAt: Date,
    rejectedAt: Date
  },
  { timestamps: true }
);

invitationSchema.index(
  { workspaceId: 1, projectId: 1, email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports =
  mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
