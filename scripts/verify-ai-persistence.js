require("dotenv").config();

const connectDB = require("../config/db");
const {
  AIReview,
  Activity,
  Member,
  Project,
  User,
  Workspace
} = require("../models");
const { aiCodeReview } = require("../services/aiService");

let stage = "idle";

async function cleanupSmokeData() {
  const oldUsers = await User.find({ email: /^ai-smoke-/ }).select("_id").lean();
  const oldUserIds = oldUsers.map((user) => user._id);
  const oldWorkspaces = await Workspace.find({ workspaceName: /^AI Smoke / })
    .select("_id")
    .lean();
  const oldWorkspaceIds = oldWorkspaces.map((workspace) => workspace._id);
  const oldProjects = await Project.find({ projectName: "AI Smoke Project" })
    .select("_id")
    .lean();
  const oldProjectIds = oldProjects.map((project) => project._id);

  await Promise.all([
    AIReview.deleteMany({ projectId: { $in: oldProjectIds } }),
    Activity.deleteMany({ projectId: { $in: oldProjectIds } }),
    Project.deleteMany({ _id: { $in: oldProjectIds } }),
    Member.deleteMany({
      $or: [
        { workspaceId: { $in: oldWorkspaceIds } },
        { userId: { $in: oldUserIds } }
      ]
    }),
    Workspace.deleteMany({ _id: { $in: oldWorkspaceIds } }),
    User.deleteMany({ _id: { $in: oldUserIds } })
  ]);
}

async function main() {
  stage = "connect";
  await connectDB();
  stage = "cleanup-before";
  await cleanupSmokeData();

  stage = "create-smoke-records";
  const stamp = Date.now();
  const user = await User.create({
    name: "AI Smoke Test",
    email: `ai-smoke-${stamp}@devwatch.local`,
    provider: "local"
  });
  const workspace = await Workspace.create({
    workspaceName: `AI Smoke ${stamp}`,
    ownerId: user._id
  });
  const project = await Project.create({
    workspaceId: workspace._id,
    projectName: "AI Smoke Project",
    createdBy: user._id,
    members: [user._id]
  });

  stage = "groq-review";
  const result = await aiCodeReview({
    projectId: String(project._id),
    requestedBy: String(user._id),
    filePath: "/src/smoke.js",
    code: "function divide(a,b){ return a / b }"
  });
  stage = "count-review";
  const reviewCount = await AIReview.countDocuments({ projectId: project._id });

  console.log(
    JSON.stringify({
      score: result.score,
      reviewStored: reviewCount > 0,
      reviewId: Boolean(result.reviewId)
    })
  );

  stage = "cleanup-after";
  await cleanupSmokeData();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[${stage}] ${error.message}`);
    process.exit(1);
  });
