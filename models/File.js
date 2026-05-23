const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null
    },
    type: {
      type: String,
      enum: ["file", "folder"],
      default: "file",
      index: true
    },
    name: {
      type: String,
      trim: true,
      required: true
    },
    path: {
      type: String,
      trim: true,
      required: true
    },
    content: {
      type: String,
      default: ""
    },
    language: {
      type: String,
      trim: true,
      default: "plaintext"
    },
    size: {
      type: Number,
      default: 0
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

fileSchema.index({ projectId: 1, path: 1 }, { unique: true });

module.exports = mongoose.models.File || mongoose.model("File", fileSchema);
