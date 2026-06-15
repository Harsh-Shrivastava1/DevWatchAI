const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
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
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed", "stopped", "timed-out"],
      default: "queued",
      index: true
    },
    runtime: {
      type: String,
      trim: true,
      default: ""
    },
    entryFile: {
      type: String,
      trim: true,
      default: ""
    },
    stdout: {
      type: String,
      default: ""
    },
    stderr: {
      type: String,
      default: ""
    },
    exitCode: Number,
    signal: String,
    durationMs: Number,
    startedAt: Date,
    finishedAt: Date,
    errorFile: String,
    errorLine: Number
  },
  { timestamps: true }
);

executionSchema.index({ projectId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Execution || mongoose.model("Execution", executionSchema);
