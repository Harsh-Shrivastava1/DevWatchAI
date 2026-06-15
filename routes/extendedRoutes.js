const crypto = require("node:crypto");
const express = require("express");
const {
  Activity,
  AIReview,
  Chat,
  Deployment,
  Execution,
  File,
  Invitation,
  Member,
  Monitoring,
  Notification,
  Project,
  User,
  Version,
  Workspace
} = require("../models");
const { requireAuth } = require("../middleware/auth");
const { sendInvitationEmail } = require("../services/inviteService");
const { startDeployment } = require("../services/deploymentService");
const { startExecution, stopExecution } = require("../services/runtimeService");
const {
  assertProjectAccess,
  assertWorkspaceAccess,
  createActivity,
  createVersion,
  emitProject,
  httpError,
  languageFromPath,
  normalizePath,
  parentPath,
  pathName,
  requireObjectId,
  serialize
} = require("../services/platformUtils");

const router = express.Router();
const supportedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".html",
  ".css",
  ".md",
  ".txt",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".go",
  ".rs",
  ".yaml",
  ".yml",
  ".env"
]);

router.use(requireAuth);

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

router.post(
  "/files/import",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.body.projectId, "projectId");
    const { project } = await assertProjectAccess(request, projectId, true);
    const incoming = Array.isArray(request.body.files) ? request.body.files : [];
    if (!incoming.length) throw httpError(400, "At least one file is required.");
    if (incoming.length > 500) throw httpError(413, "A single import can contain at most 500 files.");

    const existing = await File.find({ projectId }).select("path").lean();
    const usedPaths = new Set(existing.map((item) => item.path));
    const created = [];
    const rejected = [];

    for (const item of incoming) {
      const requestedPath = normalizePath(item.path || item.name);
      if (!isSupportedFile(requestedPath)) {
        rejected.push({ path: requestedPath, reason: "Unsupported file type" });
        continue;
      }

      const content = typeof item.content === "string" ? item.content : "";
      if (Buffer.byteLength(content, "utf8") > 2 * 1024 * 1024) {
        rejected.push({ path: requestedPath, reason: "File exceeds the 2 MB limit" });
        continue;
      }

      const finalPath = uniquePath(requestedPath, usedPaths);
      const parentId = await ensureFolderPath(projectId, parentPath(finalPath), request.user._id);
      const file = await File.create({
        projectId,
        parentId,
        type: "file",
        name: pathName(finalPath),
        path: finalPath,
        content,
        language: languageFromPath(finalPath),
        size: Buffer.byteLength(content, "utf8"),
        revision: 1,
        lastEditedBy: request.user._id
      });
      await createVersion(file, "import", request.user._id, {
        requestedPath,
        duplicateResolved: requestedPath !== finalPath
      });
      usedPaths.add(finalPath);
      created.push(serialize(file));
    }

    await createActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: request.user._id,
      action: "files.imported",
      targetType: "file",
      metadata: { created: created.length, rejected: rejected.length }
    });
    emitProject(request, projectId, "project:files-changed", {
      action: "import",
      files: created
    });

    response.status(created.length ? 201 : 422).json({
      success: created.length > 0,
      data: { created, rejected }
    });
  })
);

router.post(
  "/folders",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.body.projectId, "projectId");
    const { project } = await assertProjectAccess(request, projectId, true);
    const folderPath = normalizePath(request.body.path);
    if (folderPath === "/") throw httpError(400, "Root folder already exists.");
    if (await File.exists({ projectId, path: folderPath })) {
      throw httpError(409, "A file or folder already exists at this path.");
    }

    const parentId = await ensureFolderPath(projectId, parentPath(folderPath), request.user._id);
    const folder = await File.create({
      projectId,
      parentId,
      type: "folder",
      name: pathName(folderPath),
      path: folderPath,
      revision: 1,
      lastEditedBy: request.user._id
    });
    await createVersion(folder, "create", request.user._id);
    await createActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: request.user._id,
      action: "folder.created",
      targetType: "file",
      targetId: folder._id,
      targetPath: folder.path
    });
    emitProject(request, projectId, "project:files-changed", {
      action: "create",
      file: serialize(folder)
    });
    response.status(201).json({ success: true, data: serialize(folder) });
  })
);

router.patch(
  "/files/:fileId",
  asyncHandler(async (request, response) => {
    const fileId = requireObjectId(request.params.fileId, "fileId");
    const file = await File.findById(fileId);
    if (!file) throw httpError(404, "File or folder not found.");
    const { project } = await assertProjectAccess(request, file.projectId, true);

    if (
      Number.isInteger(request.body.expectedRevision) &&
      request.body.expectedRevision !== file.revision
    ) {
      response.status(409).json({
        success: false,
        error: "This file changed on another client.",
        code: "REVISION_CONFLICT",
        data: serialize(file)
      });
      return;
    }

    const previousPath = file.path;
    const nextPath = request.body.path ? normalizePath(request.body.path) : file.path;
    const pathChanged = nextPath !== file.path;
    const contentChanged =
      typeof request.body.content === "string" && request.body.content !== file.content;

    if (pathChanged && (await File.exists({ projectId: file.projectId, path: nextPath }))) {
      throw httpError(409, "A file or folder already exists at the destination path.");
    }

    const action = pathChanged
      ? parentPath(previousPath) === parentPath(nextPath)
        ? "rename"
        : "move"
      : request.body.action === "ai-fix"
        ? "ai-fix"
        : "save";
    await createVersion(file, action, request.user._id, { nextPath });

    if (pathChanged && file.type === "folder") {
      const descendants = await File.find({
        projectId: file.projectId,
        path: { $regex: `^${escapeRegex(previousPath)}/` }
      });
      for (const descendant of descendants) {
        descendant.path = `${nextPath}${descendant.path.slice(previousPath.length)}`;
        descendant.name = pathName(descendant.path);
        descendant.revision += 1;
        await descendant.save();
      }
    }

    if (pathChanged) {
      file.path = nextPath;
      file.name = pathName(nextPath);
      file.parentId = await findParentId(file.projectId, parentPath(nextPath));
    }
    if (contentChanged) {
      file.content = request.body.content;
      file.size = Buffer.byteLength(file.content, "utf8");
    }
    if (request.body.language) file.language = request.body.language;
    if (Number.isFinite(request.body.sortOrder)) file.sortOrder = request.body.sortOrder;
    file.lastEditedBy = request.user._id;
    file.revision += 1;
    await file.save();

    await createActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: request.user._id,
      action: `file.${action}`,
      targetType: "file",
      targetId: file._id,
      targetPath: file.path,
      metadata: { previousPath, revision: file.revision }
    });
    emitProject(request, project._id, "project:files-changed", {
      action,
      file: serialize(file),
      previousPath
    });
    response.json({ success: true, data: serialize(file) });
  })
);

router.post(
  "/files/:fileId/duplicate",
  asyncHandler(async (request, response) => {
    const fileId = requireObjectId(request.params.fileId, "fileId");
    const source = await File.findById(fileId);
    if (!source) throw httpError(404, "File or folder not found.");
    const { project } = await assertProjectAccess(request, source.projectId, true);
    const used = new Set(
      (await File.find({ projectId: source.projectId }).select("path").lean()).map(
        (item) => item.path
      )
    );
    const requestedPath = request.body.path
      ? normalizePath(request.body.path)
      : uniquePath(source.path, used, " copy");
    const created = await duplicateEntry(source, requestedPath, request.user._id, used);

    await createActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: request.user._id,
      action: "file.duplicated",
      targetType: "file",
      targetId: source._id,
      targetPath: source.path,
      metadata: { destination: requestedPath, count: created.length }
    });
    emitProject(request, project._id, "project:files-changed", {
      action: "duplicate",
      files: created.map(serialize)
    });
    response.status(201).json({ success: true, data: created.map(serialize) });
  })
);

router.get(
  "/files/:fileId/versions",
  asyncHandler(async (request, response) => {
    const fileId = requireObjectId(request.params.fileId, "fileId");
    const file = await File.findById(fileId);
    if (!file) throw httpError(404, "File not found.");
    await assertProjectAccess(request, file.projectId);
    const versions = await Version.find({ fileId }).sort({ createdAt: -1 }).limit(100);
    response.json({ success: true, data: versions.map(serialize) });
  })
);

router.get(
  "/projects/:projectId/versions",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const versions = await Version.find({ projectId }).sort({ createdAt: -1 }).limit(200);
    response.json({ success: true, data: versions.map(serialize) });
  })
);

router.post(
  "/versions/:versionId/restore",
  asyncHandler(async (request, response) => {
    const versionId = requireObjectId(request.params.versionId, "versionId");
    const version = await Version.findById(versionId);
    if (!version) throw httpError(404, "Version not found.");
    const { project } = await assertProjectAccess(request, version.projectId, true);
    const existing = version.fileId ? await File.findById(version.fileId) : null;
    if (existing) await createVersion(existing, "restore", request.user._id, { from: versionId });

    const parentId = await ensureFolderPath(
      version.projectId,
      parentPath(version.path),
      request.user._id
    );
    const file = await File.findOneAndUpdate(
      { projectId: version.projectId, path: version.path },
      {
        $set: {
          parentId,
          name: version.name,
          type: version.type,
          content: version.content,
          language: version.language,
          size: Buffer.byteLength(version.content || "", "utf8"),
          lastEditedBy: request.user._id
        },
        $inc: { revision: 1 }
      },
      { new: true, upsert: true }
    );
    await createActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: request.user._id,
      action: "file.restored",
      targetType: "file",
      targetId: file._id,
      targetPath: file.path,
      metadata: { versionId }
    });
    emitProject(request, project._id, "project:files-changed", {
      action: "restore",
      file: serialize(file)
    });
    response.json({ success: true, data: serialize(file) });
  })
);

router.delete(
  "/projects/:projectId",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const { project, access } = await assertProjectAccess(request, projectId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only workspace owners and admins can delete projects.");
    }

    const files = await File.find({ projectId });
    for (const file of files) {
      await createVersion(file, "delete", request.user._id, { projectDeleted: true });
    }
    await Promise.all([
      File.deleteMany({ projectId }),
      Chat.deleteMany({ projectId }),
      AIReview.deleteMany({ projectId }),
      Monitoring.deleteMany({ projectId }),
      Deployment.deleteMany({ projectId }),
      Execution.deleteMany({ projectId }),
      Version.deleteMany({ projectId }),
      Invitation.updateMany({ projectId, status: "pending" }, { status: "cancelled" }),
      Activity.deleteMany({ projectId }),
      Project.deleteOne({ _id: projectId })
    ]);
    emitProject(request, projectId, "project:deleted", { projectId });
    response.json({ success: true, data: serialize(project) });
  })
);

router.patch(
  "/projects/:projectId",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const { project } = await assertProjectAccess(request, projectId, true);
    if (request.body.projectName !== undefined) {
      const name = String(request.body.projectName).trim();
      if (!name) throw httpError(400, "projectName cannot be empty.");
      project.projectName = name;
    }
    if (request.body.description !== undefined) {
      project.description = String(request.body.description).trim();
    }
    if (request.body.status !== undefined) {
      if (!["Healthy", "Reviewing", "Deploying", "Warning", "Archived"].includes(request.body.status)) {
        throw httpError(400, "Invalid project status.");
      }
      project.status = request.body.status;
    }
    await project.save();
    emitProject(request, projectId, "project:updated", serialize(project));
    response.json({ success: true, data: serialize(project) });
  })
);

router.patch(
  "/workspaces/:workspaceId",
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.params.workspaceId, "workspaceId");
    const access = await assertWorkspaceAccess(request, workspaceId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only workspace owners and admins can update workspace settings.");
    }
    if (request.body.workspaceName !== undefined) {
      const name = String(request.body.workspaceName).trim();
      if (!name) throw httpError(400, "workspaceName cannot be empty.");
      access.workspace.workspaceName = name;
      access.workspace.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    if (request.body.settings && typeof request.body.settings === "object") {
      access.workspace.settings = {
        ...access.workspace.settings.toObject?.(),
        ...request.body.settings
      };
    }
    await access.workspace.save();
    response.json({ success: true, data: serialize(access.workspace) });
  })
);

router.delete(
  "/workspaces/:workspaceId",
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.params.workspaceId, "workspaceId");
    const access = await assertWorkspaceAccess(request, workspaceId);
    if (access.role !== "owner") {
      throw httpError(403, "Only the workspace owner can delete this workspace.");
    }
    const projects = await Project.find({ workspaceId }).select("_id").lean();
    const projectIds = projects.map((project) => project._id);
    await Promise.all([
      File.deleteMany({ projectId: { $in: projectIds } }),
      Version.deleteMany({ projectId: { $in: projectIds } }),
      Chat.deleteMany({ projectId: { $in: projectIds } }),
      AIReview.deleteMany({ projectId: { $in: projectIds } }),
      Monitoring.deleteMany({ projectId: { $in: projectIds } }),
      Deployment.deleteMany({ projectId: { $in: projectIds } }),
      Execution.deleteMany({ projectId: { $in: projectIds } }),
      Notification.deleteMany({ workspaceId }),
      Invitation.deleteMany({ workspaceId }),
      Activity.deleteMany({ workspaceId }),
      Member.deleteMany({ workspaceId }),
      Project.deleteMany({ workspaceId }),
      Workspace.deleteOne({ _id: workspaceId })
    ]);
    response.json({ success: true, data: serialize(access.workspace) });
  })
);

router.patch(
  "/members/:memberId",
  asyncHandler(async (request, response) => {
    const memberId = requireObjectId(request.params.memberId, "memberId");
    const member = await Member.findById(memberId);
    if (!member) throw httpError(404, "Member not found.");
    const access = await assertWorkspaceAccess(request, member.workspaceId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only owners and admins can change member roles.");
    }
    if (!["admin", "developer", "viewer"].includes(request.body.role)) {
      throw httpError(400, "Invalid member role.");
    }
    if (member.role === "owner") throw httpError(409, "Workspace owner role cannot be changed.");
    member.role = request.body.role;
    await member.save();
    response.json({ success: true, data: serialize(member) });
  })
);

router.delete(
  "/members/:memberId",
  asyncHandler(async (request, response) => {
    const memberId = requireObjectId(request.params.memberId, "memberId");
    const member = await Member.findById(memberId);
    if (!member) throw httpError(404, "Member not found.");
    const access = await assertWorkspaceAccess(request, member.workspaceId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only owners and admins can remove members.");
    }
    if (member.role === "owner") throw httpError(409, "Workspace owner cannot be removed.");
    member.status = "removed";
    await member.save();
    await Project.updateMany(
      { workspaceId: member.workspaceId },
      { $pull: { members: member.userId } }
    );
    response.json({ success: true, data: serialize(member) });
  })
);

router.delete(
  "/invites/:invitationId",
  asyncHandler(async (request, response) => {
    const invitationId = requireObjectId(request.params.invitationId, "invitationId");
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) throw httpError(404, "Invitation not found.");
    const access = await assertWorkspaceAccess(request, invitation.workspaceId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only owners and admins can cancel invitations.");
    }
    invitation.status = "cancelled";
    await invitation.save();
    response.json({ success: true, data: serialize(invitation) });
  })
);

router.get(
  "/search",
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const query = String(request.query.q || "").trim();
    if (query.length < 2) throw httpError(400, "Search query must contain at least two characters.");
    const projectId = request.query.projectId
      ? requireObjectId(request.query.projectId, "projectId")
      : null;
    const projects = await Project.find({
      workspaceId,
      ...(projectId ? { _id: projectId } : {}),
      $or: [
        { projectName: { $regex: escapeRegex(query), $options: "i" } },
        { description: { $regex: escapeRegex(query), $options: "i" } }
      ]
    })
      .limit(30)
      .lean();
    const workspaceProjects = projectId
      ? [{ _id: projectId }]
      : await Project.find({ workspaceId }).select("_id").lean();
    const fileQuery = {
      projectId: { $in: workspaceProjects.map((item) => item._id) },
      $text: { $search: query }
    };
    let files;
    try {
      files = await File.find(fileQuery).limit(50).lean();
    } catch {
      files = await File.find({
        projectId: fileQuery.projectId,
        $or: [
          { path: { $regex: escapeRegex(query), $options: "i" } },
          { content: { $regex: escapeRegex(query), $options: "i" } }
        ]
      })
        .limit(50)
        .lean();
    }
    response.json({
      success: true,
      data: { projects: projects.map(serialize), files: files.map(serialize) }
    });
  })
);

router.post(
  "/invites",
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.body.workspaceId, "workspaceId");
    const access = await assertWorkspaceAccess(request, workspaceId);
    if (!["owner", "admin"].includes(access.role)) {
      throw httpError(403, "Only workspace owners and admins can invite members.");
    }
    const email = String(request.body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, "Enter a valid email address.");
    }
    if (email === request.user.email) throw httpError(409, "You are already in this workspace.");
    const projectId = request.body.projectId
      ? requireObjectId(request.body.projectId, "projectId")
      : null;
    if (projectId) await assertProjectAccess(request, projectId);
    const existingUser = await User.findOne({ email }).select("_id");
    const existingMember = await Member.findOne({
      workspaceId,
      status: { $in: ["active", "invited"] },
      $or: [
        { invitedEmail: email },
        ...(existingUser ? [{ userId: existingUser._id }] : [])
      ]
    });
    if (existingMember) {
      throw httpError(409, "This email is already a workspace member or invitee.");
    }
    if (await Invitation.exists({ workspaceId, projectId, email, status: "pending" })) {
      throw httpError(409, "A pending invitation already exists for this email.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const invitation = await Invitation.create({
      workspaceId,
      projectId,
      email,
      role: ["admin", "developer", "viewer"].includes(request.body.role)
        ? request.body.role
        : "developer",
      tokenHash,
      invitedBy: request.user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    const appUrl =
      process.env.APP_URL ||
      String(process.env.CLIENT_ORIGIN || "http://127.0.0.1:3000").split(",")[0];
    const inviteUrl = `${appUrl.replace(/\/$/, "")}/?invite=${rawToken}`;
    try {
      await sendInvitationEmail({
        email,
        inviterName: request.user.name || request.user.email,
        workspaceName: access.workspace.workspaceName,
        inviteUrl,
        role: invitation.role
      });
    } catch (error) {
      await invitation.deleteOne();
      throw error;
    }
    await createActivity({
      workspaceId,
      projectId,
      actorId: request.user._id,
      action: "member.invited",
      targetType: "member",
      metadata: { email, role: invitation.role }
    });
    response.status(201).json({
      success: true,
      data: serialize(invitation)
    });
  })
);

router.get(
  "/invites",
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const invites = await Invitation.find({ workspaceId })
      .select("-tokenHash")
      .sort({ createdAt: -1 });
    response.json({ success: true, data: invites.map(serialize) });
  })
);

router.post(
  "/invites/:token/accept",
  asyncHandler(async (request, response) => {
    const invitation = await Invitation.findOne({
      tokenHash: hashToken(request.params.token),
      status: "pending"
    });
    if (!invitation) throw httpError(404, "Invitation is invalid or no longer pending.");
    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw httpError(410, "Invitation has expired.");
    }
    if (invitation.email !== request.user.email.toLowerCase()) {
      throw httpError(403, "Sign in with the email address that received this invitation.");
    }

    const member = await Member.findOneAndUpdate(
      { workspaceId: invitation.workspaceId, userId: request.user._id },
      {
        $set: { role: invitation.role, status: "active", joinedAt: new Date() },
        $setOnInsert: { invitedEmail: invitation.email, invitedBy: invitation.invitedBy }
      },
      { new: true, upsert: true }
    );
    if (invitation.projectId) {
      await Project.findByIdAndUpdate(invitation.projectId, {
        $addToSet: { members: request.user._id }
      });
    }
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();
    response.json({ success: true, data: serialize(member) });
  })
);

router.post(
  "/invites/:token/reject",
  asyncHandler(async (request, response) => {
    const invitation = await Invitation.findOne({
      tokenHash: hashToken(request.params.token),
      status: "pending"
    });
    if (!invitation) throw httpError(404, "Invitation is invalid or no longer pending.");
    if (invitation.email !== request.user.email.toLowerCase()) {
      throw httpError(403, "Sign in with the email address that received this invitation.");
    }
    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    await invitation.save();
    response.json({ success: true, data: serialize(invitation) });
  })
);

router.get(
  "/projects/:projectId/chat",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const limit = Math.min(100, Math.max(10, Number(request.query.limit) || 50));
    const before = request.query.before ? new Date(String(request.query.before)) : null;
    const messages = await Chat.find({
      projectId,
      ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {})
    })
      .populate("sender", "name email photoURL")
      .sort({ createdAt: -1 })
      .limit(limit);
    response.json({
      success: true,
      data: messages.reverse().map(serialize),
      hasMore: messages.length === limit
    });
  })
);

router.post(
  "/projects/:projectId/chat/read",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    await Chat.updateMany(
      { projectId, "readBy.userId": { $ne: request.user._id } },
      { $push: { readBy: { userId: request.user._id, readAt: new Date() } } }
    );
    response.json({ success: true, data: { projectId, read: true } });
  })
);

router.post(
  "/monitoring",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.body.projectId, "projectId");
    await assertProjectAccess(request, projectId, true);
    const record = await Monitoring.create({
      projectId,
      cpu: boundedNumber(request.body.cpu, 0, 100),
      ram: boundedNumber(request.body.ram, 0, 100),
      latency: boundedNumber(request.body.latency, 0),
      uptime: boundedNumber(request.body.uptime, 0, 100),
      traffic: boundedNumber(request.body.traffic, 0),
      activeSessions: boundedNumber(request.body.activeSessions, 0),
      apiLatency: boundedNumber(request.body.apiLatency, 0),
      errorCount: boundedNumber(request.body.errorCount, 0),
      buildCount: boundedNumber(request.body.buildCount, 0),
      aiRequests: boundedNumber(request.body.aiRequests, 0),
      deploymentStatus: request.body.deploymentStatus || "",
      status: ["healthy", "warning", "critical"].includes(request.body.status)
        ? request.body.status
        : "healthy",
      source: "manual",
      alerts: Array.isArray(request.body.alerts) ? request.body.alerts.slice(0, 50) : []
    });
    emitProject(request, projectId, "monitoring:updated", serialize(record));
    response.status(201).json({ success: true, data: serialize(record) });
  })
);

router.post(
  "/projects/:projectId/run",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const { project } = await assertProjectAccess(request, projectId, true);
    const files = await File.find({ projectId }).lean();
    const execution = await startExecution({
      project,
      userId: request.user._id,
      files,
      io: request.app.get("io")
    });
    response.status(202).json({ success: true, data: serialize(execution) });
  })
);

router.post(
  "/executions/:executionId/stop",
  asyncHandler(async (request, response) => {
    const executionId = requireObjectId(request.params.executionId, "executionId");
    const execution = await Execution.findById(executionId);
    if (!execution) throw httpError(404, "Execution not found.");
    await assertProjectAccess(request, execution.projectId, true);
    const stopped = await stopExecution(executionId);
    if (!stopped) throw httpError(409, "Execution is no longer running.");
    execution.status = "stopped";
    await execution.save();
    response.json({ success: true, data: serialize(execution) });
  })
);

router.get(
  "/projects/:projectId/executions",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const executions = await Execution.find({ projectId }).sort({ createdAt: -1 }).limit(50);
    response.json({ success: true, data: executions.map(serialize) });
  })
);

router.post(
  "/projects/:projectId/deploy",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const { project } = await assertProjectAccess(request, projectId, true);
    const files = await File.find({ projectId }).lean();
    const deployment = await startDeployment({
      project,
      userId: request.user._id,
      files,
      io: request.app.get("io"),
      environment: request.body.environment || "preview"
    });
    response.status(202).json({ success: true, data: serialize(deployment) });
  })
);

router.get(
  "/projects/:projectId/deployments",
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const deployments = await Deployment.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(50);
    response.json({ success: true, data: deployments.map(serialize) });
  })
);

async function ensureFolderPath(projectId, folderPath, userId) {
  const normalized = normalizePath(folderPath);
  if (normalized === "/") return null;
  const segments = normalized.split("/").filter(Boolean);
  let currentPath = "";
  let parentId = null;
  for (const segment of segments) {
    currentPath += `/${segment}`;
    let folder = await File.findOne({ projectId, path: currentPath });
    if (folder && folder.type !== "folder") {
      throw httpError(409, `${currentPath} is a file and cannot contain imported entries.`);
    }
    if (!folder) {
      folder = await File.create({
        projectId,
        parentId,
        type: "folder",
        name: segment,
        path: currentPath,
        revision: 1,
        lastEditedBy: userId
      });
      await createVersion(folder, "import", userId, { generated: true });
    }
    parentId = folder._id;
  }
  return parentId;
}

async function findParentId(projectId, folderPath) {
  if (normalizePath(folderPath) === "/") return null;
  const parent = await File.findOne({ projectId, path: normalizePath(folderPath), type: "folder" });
  if (!parent) throw httpError(409, "Destination folder does not exist.");
  return parent._id;
}

async function duplicateEntry(source, destinationPath, userId, usedPaths) {
  const finalPath = uniquePath(normalizePath(destinationPath), usedPaths, " copy");
  const parentId = await ensureFolderPath(source.projectId, parentPath(finalPath), userId);
  const copy = await File.create({
    projectId: source.projectId,
    parentId,
    type: source.type,
    name: pathName(finalPath),
    path: finalPath,
    content: source.content,
    language: source.language,
    size: source.size,
    revision: 1,
    lastEditedBy: userId
  });
  usedPaths.add(finalPath);
  await createVersion(copy, "duplicate", userId, { sourceFileId: source._id });
  const created = [copy];
  if (source.type === "folder") {
    const descendants = await File.find({
      projectId: source.projectId,
      path: { $regex: `^${escapeRegex(source.path)}/` }
    }).sort({ path: 1 });
    for (const descendant of descendants) {
      const nextPath = `${finalPath}${descendant.path.slice(source.path.length)}`;
      const descendantCopy = await duplicateEntry(descendant, nextPath, userId, usedPaths);
      created.push(...descendantCopy);
    }
  }
  return created;
}

function uniquePath(requestedPath, usedPaths, label = "") {
  const normalized = normalizePath(requestedPath);
  if (!usedPaths.has(normalized)) return normalized;
  const parent = parentPath(normalized);
  const name = pathName(normalized);
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";
  let index = 1;
  let candidate;
  do {
    const suffix = label || ` (${index})`;
    candidate = normalizePath(`${parent}/${base}${suffix}${label ? ` ${index}` : ""}${extension}`);
    index += 1;
  } while (usedPaths.has(candidate));
  return candidate;
}

function isSupportedFile(filePath) {
  const name = pathName(filePath).toLowerCase();
  if (name === ".env") return true;
  const dot = name.lastIndexOf(".");
  return dot >= 0 && supportedExtensions.has(name.slice(dot));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function boundedNumber(value, min, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

module.exports = router;
