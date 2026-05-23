const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true
    },
    room: {
      type: String,
      trim: true,
      default: "general",
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    message: {
      type: String,
      trim: true,
      required: true
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

chatSchema.index({ projectId: 1, createdAt: -1 });
chatSchema.index({ workspaceId: 1, room: 1, createdAt: -1 });

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
