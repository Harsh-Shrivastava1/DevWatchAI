const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    projectName: {
      type: String,
      trim: true,
      required: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["Healthy", "Reviewing", "Deploying", "Warning", "Archived"],
      default: "Healthy",
      index: true
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastOpenedAt: Date
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, projectName: 1 });

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);
