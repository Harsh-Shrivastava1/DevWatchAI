const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
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
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    action: {
      type: String,
      trim: true,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: [
        "workspace",
        "project",
        "file",
        "chat",
        "ai-review",
        "deployment",
        "member",
        "system"
      ],
      default: "system"
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetPath: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

activitySchema.index({ workspaceId: 1, createdAt: -1 });
activitySchema.index({ projectId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);
