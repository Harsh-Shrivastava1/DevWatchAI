const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    invitedEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      enum: ["owner", "admin", "developer", "viewer"],
      default: "developer",
      index: true
    },
    status: {
      type: String,
      enum: ["invited", "active", "removed"],
      default: "active"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

memberSchema.index({ workspaceId: 1, userId: 1 });
memberSchema.index({ workspaceId: 1, invitedEmail: 1 });

module.exports = mongoose.models.Member || mongoose.model("Member", memberSchema);
