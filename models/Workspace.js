const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    workspaceName: {
      type: String,
      trim: true,
      required: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member"
      }
    ],
    settings: {
      aiReviewBeforeDeploy: {
        type: Boolean,
        default: true
      },
      exportEnabled: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

workspaceSchema.index({ ownerId: 1, workspaceName: 1 });

module.exports =
  mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
