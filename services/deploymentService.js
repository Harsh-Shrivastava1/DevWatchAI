const crypto = require("node:crypto");
const {
  Activity,
  Deployment,
  Monitoring,
  Project
} = require("../models");

async function startDeployment({ project, userId, files, io, environment = "preview" }) {
  const deployment = await Deployment.create({
    workspaceId: project.workspaceId,
    projectId: project._id,
    triggeredBy: userId,
    environment,
    provider: "artifact",
    status: "queued",
    buildId: crypto.randomBytes(8).toString("hex"),
    progress: 0,
    checks: [
      { name: "Project validation", status: "pending" },
      { name: "Configuration checks", status: "pending" },
      { name: "Artifact generation", status: "pending" }
    ]
  });

  void performDeployment({ deployment, project, files, io });
  return deployment;
}

async function performDeployment({ deployment, project, files, io }) {
  const startedAt = Date.now();
  try {
    deployment.status = "running";
    deployment.startedAt = new Date();
    deployment.progress = 15;
    appendLog(deployment, "Starting deployment validation.");
    await deployment.save();
    emit(io, project._id, deployment);

    if (!files.some((file) => file.type === "file")) {
      throw new Error("Project has no files to deploy.");
    }
    deployment.checks[0].status = "success";
    deployment.checks[0].message = `${files.length} project entries validated.`;
    deployment.progress = 40;
    appendLog(deployment, "Project files validated.");

    const packageFile = files.find((file) => file.path === "/package.json");
    if (packageFile) {
      JSON.parse(packageFile.content || "{}");
      appendLog(deployment, "package.json is valid JSON.");
    } else {
      appendLog(deployment, "No package.json found; creating source artifact only.");
    }
    deployment.checks[1].status = "success";
    deployment.checks[1].message = "Configuration checks passed.";
    deployment.progress = 70;
    await deployment.save();
    emit(io, project._id, deployment);

    deployment.checks[2].status = "success";
    deployment.checks[2].message = "Exportable ZIP artifact is ready.";
    deployment.artifactReady = true;
    deployment.progress = 100;
    deployment.status = "success";
    deployment.finishedAt = new Date();
    deployment.durationMs = Date.now() - startedAt;
    appendLog(deployment, "Deployment artifact generated successfully.");
    await deployment.save();
    await Project.findByIdAndUpdate(project._id, { status: "Healthy" });
  } catch (error) {
    const pendingCheck = deployment.checks.find((check) => check.status === "pending");
    if (pendingCheck) {
      pendingCheck.status = "failed";
      pendingCheck.message = error.message;
    }
    deployment.status = "failed";
    deployment.finishedAt = new Date();
    deployment.durationMs = Date.now() - startedAt;
    appendLog(deployment, `Deployment failed: ${error.message}`);
    await deployment.save();
    await Project.findByIdAndUpdate(project._id, { status: "Warning" });
  }

  await Promise.all([
    Activity.create({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: deployment.triggeredBy,
      action: `deployment.${deployment.status}`,
      targetType: "deployment",
      targetId: deployment._id,
      metadata: { buildId: deployment.buildId }
    }),
    Monitoring.create({
      projectId: project._id,
      buildCount: 1,
      deploymentStatus: deployment.status,
      latency: deployment.durationMs || 0,
      status: deployment.status === "success" ? "healthy" : "critical",
      errorCount: deployment.status === "success" ? 0 : 1,
      source: "deployment"
    })
  ]);

  emit(io, project._id, deployment);
}

function appendLog(deployment, line) {
  deployment.logs = `${deployment.logs || ""}${new Date().toISOString()} ${line}\n`.slice(
    -250000
  );
}

function emit(io, projectId, deployment) {
  if (!io) return;
  const value = deployment.toObject ? deployment.toObject() : deployment;
  io.to(`project:${projectId}`).emit("deployment:updated", {
    ...value,
    id: String(value._id)
  });
}

module.exports = { startDeployment };
