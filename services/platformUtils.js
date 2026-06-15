const mongoose = require("mongoose");
const {
  Activity,
  Member,
  Project,
  Version,
  Workspace
} = require("../models");

function serialize(document) {
  if (!document) return null;
  const value = document.toObject ? document.toObject() : document;
  return {
    ...value,
    id: String(value._id)
  };
}

function requireObjectId(id, name) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`${name} must be a valid ObjectId.`);
    error.status = 400;
    throw error;
  }
  return id;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getWorkspaceAccess(userId, workspaceId) {
  const [workspace, member] = await Promise.all([
    Workspace.findById(workspaceId),
    Member.findOne({ workspaceId, userId, status: "active" })
  ]);

  if (!workspace) throw httpError(404, "Workspace not found.");

  const isOwner = String(workspace.ownerId) === String(userId);
  if (!isOwner && !member) {
    throw httpError(403, "You do not have access to this workspace.");
  }

  return {
    workspace,
    member,
    role: isOwner ? "owner" : member.role
  };
}

async function assertWorkspaceAccess(request, workspaceId, write = false) {
  const access = await getWorkspaceAccess(request.user._id, workspaceId);
  if (write && !["owner", "admin", "developer"].includes(access.role)) {
    throw httpError(403, "Viewer access cannot modify this workspace.");
  }
  return access;
}

async function assertProjectAccess(request, projectId, write = false) {
  const project = await Project.findById(projectId);
  if (!project) throw httpError(404, "Project not found.");
  const access = await assertWorkspaceAccess(request, project.workspaceId, write);
  return { project, access };
}

function normalizePath(value) {
  const input = String(value || "").replace(/\\/g, "/").trim();
  const segments = input
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== "..");
  return `/${segments.join("/")}`;
}

function pathName(value) {
  return normalizePath(value).split("/").filter(Boolean).pop() || "";
}

function parentPath(value) {
  const segments = normalizePath(value).split("/").filter(Boolean);
  segments.pop();
  return segments.length ? `/${segments.join("/")}` : "/";
}

function languageFromPath(value) {
  const extension = String(value).split(".").pop()?.toLowerCase();
  const languages = {
    c: "c",
    cpp: "cpp",
    css: "css",
    env: "dotenv",
    go: "go",
    html: "html",
    java: "java",
    js: "javascript",
    json: "json",
    jsx: "javascript",
    md: "markdown",
    py: "python",
    rs: "rust",
    ts: "typescript",
    tsx: "typescript",
    txt: "plaintext",
    yaml: "yaml",
    yml: "yaml"
  };
  return extension ? languages[extension] || "plaintext" : "plaintext";
}

async function createActivity({
  workspaceId,
  projectId,
  actorId,
  action,
  targetType = "system",
  targetId,
  targetPath,
  metadata
}) {
  return Activity.create({
    workspaceId,
    projectId,
    actorId,
    action,
    targetType,
    targetId,
    targetPath,
    metadata
  });
}

async function createVersion(file, action, userId, metadata = {}) {
  if (!file) return null;
  return Version.create({
    projectId: file.projectId,
    fileId: file._id,
    path: file.path,
    name: file.name,
    type: file.type,
    language: file.language,
    content: file.content,
    revision: file.revision || 0,
    action,
    createdBy: userId,
    metadata
  });
}

function emitProject(request, projectId, event, data) {
  const io = request.app.get("io");
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

module.exports = {
  assertProjectAccess,
  assertWorkspaceAccess,
  createActivity,
  createVersion,
  emitProject,
  getWorkspaceAccess,
  httpError,
  languageFromPath,
  normalizePath,
  parentPath,
  pathName,
  requireObjectId,
  serialize
};
