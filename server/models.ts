import { Schema, model, models } from "mongoose";

const timestamps = { timestamps: true };

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, required: true },
    photoURL: String
  },
  timestamps
);

const workspaceSchema = new Schema(
  {
    workspaceName: { type: String, required: true },
    ownerId: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "Member" }]
  },
  timestamps
);

const memberSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    userId: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "developer", "viewer"],
      default: "developer"
    }
  },
  timestamps
);

const projectSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    projectName: { type: String, required: true },
    description: { type: String, default: "" },
    members: [{ type: String }],
    status: { type: String, default: "Healthy" },
    aiScore: { type: Number, default: 0 }
  },
  timestamps
);

const fileSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    path: { type: String, required: true },
    content: { type: String, default: "" },
    lastEditedBy: String
  },
  timestamps
);

const chatSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sender: String,
    message: String
  },
  timestamps
);

const aiReviewSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    fileId: { type: Schema.Types.ObjectId, ref: "File" },
    score: Number,
    issues: [{ type: Schema.Types.Mixed }]
  },
  timestamps
);

const monitoringSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    cpu: Number,
    ram: Number,
    latency: Number,
    uptime: Number
  },
  timestamps
);

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    message: String,
    read: { type: Boolean, default: false }
  },
  timestamps
);

export const UserModel = models.User || model("User", userSchema);
export const WorkspaceModel =
  models.Workspace || model("Workspace", workspaceSchema);
export const MemberModel = models.Member || model("Member", memberSchema);
export const ProjectModel = models.Project || model("Project", projectSchema);
export const FileModel = models.File || model("File", fileSchema);
export const ChatModel = models.Chat || model("Chat", chatSchema);
export const AIReviewModel =
  models.AIReview || model("AIReview", aiReviewSchema);
export const MonitoringModel =
  models.Monitoring || model("Monitoring", monitoringSchema);
export const NotificationModel =
  models.Notification || model("Notification", notificationSchema);