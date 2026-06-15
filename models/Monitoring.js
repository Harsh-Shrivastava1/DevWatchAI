const mongoose = require("mongoose");

const monitoringSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    cpu: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    ram: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    latency: {
      type: Number,
      min: 0,
      default: 0
    },
    uptime: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    traffic: {
      type: Number,
      min: 0,
      default: 0
    },
    activeSessions: {
      type: Number,
      min: 0,
      default: 0
    },
    apiLatency: {
      type: Number,
      min: 0,
      default: 0
    },
    errorCount: {
      type: Number,
      min: 0,
      default: 0
    },
    buildCount: {
      type: Number,
      min: 0,
      default: 0
    },
    aiRequests: {
      type: Number,
      min: 0,
      default: 0
    },
    deploymentStatus: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["healthy", "warning", "critical"],
      default: "healthy",
      index: true
    },
    alerts: [
      {
        type: {
          type: String,
          trim: true
        },
        message: {
          type: String,
          trim: true
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium"
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    source: {
      type: String,
      enum: ["runtime", "deployment", "api", "manual"],
      default: "manual"
    }
  },
  { timestamps: true }
);

monitoringSchema.index({ projectId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Monitoring || mongoose.model("Monitoring", monitoringSchema);
