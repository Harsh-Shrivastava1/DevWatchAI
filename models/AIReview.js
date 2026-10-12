const mongoose = require("mongoose");

const aiReviewIssueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Bug", "Security", "Performance", "Clean Code"],
      required: true
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    title: {
      type: String,
      trim: true,
      required: true
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    filePath: {
      type: String,
      trim: true,
      default: ""
    },
    line: Number,
    column: Number,
    suggestion: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["open", "fixed", "ignored"],
      default: "open"
    }
  },
  { _id: false }
);

const aiReviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File"
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    maintainabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    securityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    bugCount: {
      type: Number,
      min: 0,
      default: 0
    },
    complexityEstimate: {
      type: String,
      trim: true,
      default: ""
    },
    analysisType: {
      type: String,
      enum: ["file", "project", "architecture", "security", "performance", "maintainability", "complexity"],
      default: "file",
      index: true
    },
    summary: {
      type: String,
      trim: true,
      default: ""
    },
    issues: [aiReviewIssueSchema],
    model: {
      type: String,
      trim: true,
      default: () => process.env.GROQ_MODEL || "openai/gpt-oss-120b"
    },
    rawResponse: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

aiReviewSchema.index({ projectId: 1, createdAt: -1 });
aiReviewSchema.index({ fileId: 1, createdAt: -1 });

module.exports =
  mongoose.models.AIReview || mongoose.model("AIReview", aiReviewSchema);
