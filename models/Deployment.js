const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    environment: {
      type: String,
      enum: ["preview", "staging", "production"],
      default: "preview"
    },
    provider: {
      type: String,
      trim: true,
      default: "manual"
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed", "cancelled"],
      default: "queued",
      index: true
    },
    buildId: {
      type: String,
      trim: true,
      default: ""
    },
    url: {
      type: String,
      trim: true,
      default: ""
    },
    logs: {
      type: String,
      default: ""
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    artifactReady: {
      type: Boolean,
      default: false
    },
    checks: [
      {
        name: String,
        status: {
          type: String,
          enum: ["pending", "success", "failed"],
          default: "pending"
        },
        message: String
      }
    ],
    startedAt: Date,
    finishedAt: Date,
    durationMs: Number
  },
  { timestamps: true }
);

deploymentSchema.index({ projectId: 1, createdAt: -1 });
deploymentSchema.index({ workspaceId: 1, status: 1 });

module.exports =
  mongoose.models.Deployment ||
  mongoose.model("Deployment", deploymentSchema);
