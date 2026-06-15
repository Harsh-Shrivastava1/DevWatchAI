const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
      index: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["file", "folder"],
      default: "file"
    },
    language: {
      type: String,
      trim: true,
      default: "plaintext"
    },
    content: {
      type: String,
      default: ""
    },
    revision: {
      type: Number,
      min: 0,
      default: 0
    },
    action: {
      type: String,
      enum: ["create", "save", "rename", "move", "delete", "import", "duplicate", "restore", "ai-fix"],
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

versionSchema.index({ projectId: 1, createdAt: -1 });
versionSchema.index({ fileId: 1, createdAt: -1 });

module.exports = mongoose.models.Version || mongoose.model("Version", versionSchema);
