const express = require("express");
const mongoose = require("mongoose");
const archiver = require("archiver");
const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");
const { requireAuth, signSession } = require("../middleware/auth");
const {
  createVersion,
  emitProject,
  languageFromPath,
  normalizePath,
  parentPath
} = require("../services/platformUtils");
const {
  Activity,
  AIReview,
  Chat,
  Deployment,
  File,
  Member,
  Monitoring,
  Notification,
  Project,
  User,
  Workspace
} = require("../models");

const router = express.Router();

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

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

function forbidden(message = "You do not have access to this resource.") {
  const error = new Error(message);
  error.status = 403;
  throw error;
}

async function getWorkspaceMembership(userId, workspaceId) {
  const [workspace, member] = await Promise.all([
    Workspace.findById(workspaceId),
    Member.findOne({ workspaceId, userId, status: "active" })
  ]);

  if (!workspace) {
    const error = new Error("Workspace not found.");
    error.status = 404;
    throw error;
  }

  const isOwner = String(workspace.ownerId) === String(userId);
  if (!isOwner && !member) {
    forbidden();
  }

  return {
    workspace,
    member,
    role: isOwner ? "owner" : member.role
  };
}

async function assertWorkspaceAccess(request, workspaceId) {
  return getWorkspaceMembership(request.user._id, workspaceId);
}

async function assertWorkspaceWriteAccess(request, workspaceId) {
  const access = await assertWorkspaceAccess(request, workspaceId);
  if (!["owner", "admin", "developer"].includes(access.role)) {
    forbidden("Viewer access cannot modify this workspace.");
  }

  return access;
}

async function assertProjectAccess(request, projectId) {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found.");
    error.status = 404;
    throw error;
  }

  await assertWorkspaceAccess(request, project.workspaceId);
  return project;
}

async function assertProjectWriteAccess(request, projectId) {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found.");
    error.status = 404;
    throw error;
  }

  await assertWorkspaceWriteAccess(request, project.workspaceId);
  return project;
}

async function createActivity({ workspaceId, projectId, actorId, action, targetType, metadata }) {
  if (!workspaceId) return;

  await Activity.create({
    workspaceId,
    projectId,
    actorId,
    action,
    targetType,
    metadata
  });
}

async function resolveFirebaseUser(body) {
  const decoded = await verifyFirebaseIdToken(body.idToken).catch(() => null);
  if (decoded) {
    return {
      firebaseUid: decoded.uid,
      email: decoded.email,
      name: decoded.name || body.name || decoded.email || "DevWatch User",
      photoURL: decoded.picture || body.photoURL || "",
      provider: decoded.firebase?.sign_in_provider?.includes("google")
        ? "google"
        : "firebase",
      emailVerified: Boolean(decoded.email_verified)
    };
  }

  if (!body.uid || !body.email) {
    const error = new Error("Firebase token verification failed.");
    error.status = 401;
    throw error;
  }

  if (process.env.NODE_ENV === "production") {
    const error = new Error("Verified Firebase ID token is required.");
    error.status = 401;
    throw error;
  }

  return {
    firebaseUid: body.uid,
    email: body.email,
    name: body.name || body.email,
    photoURL: body.photoURL || "",
    provider: "firebase",
    emailVerified: Boolean(body.emailVerified)
  };
}

async function upsertUser(body) {
  const firebaseUser = await resolveFirebaseUser(body);
  const user = await User.findOneAndUpdate(
    {
      $or: [
        { firebaseUid: firebaseUser.firebaseUid },
        { email: firebaseUser.email.toLowerCase() }
      ]
    },
    {
      $set: {
        ...firebaseUser,
        lastLoginAt: new Date()
      },
      $setOnInsert: {
        onboardingCompleted: false
      }
    },
    { new: true, upsert: true }
  );

  return user;
}

router.post(
  "/auth/login",
  asyncHandler(async (request, response) => {
    const user = await upsertUser(request.body);

    response.json({
      success: true,
      token: signSession(user),
      user: serialize(user),
      onboardingRequired: !user.onboardingCompleted
    });
  })
);

router.post(
  "/auth/signup",
  asyncHandler(async (request, response) => {
    const user = await upsertUser(request.body);

    response.status(201).json({
      success: true,
      token: signSession(user),
      user: serialize(user),
      onboardingRequired: !user.onboardingCompleted
    });
  })
);

router.post(
  "/auth/onboarding/complete",
  requireAuth,
  asyncHandler(async (request, response) => {
    request.user.onboardingCompleted = true;
    request.user.onboardingCompletedAt = new Date();
    await request.user.save();

    response.json({
      success: true,
      user: serialize(request.user)
    });
  })
);

router.get(
  "/workspaces",
  requireAuth,
  asyncHandler(async (request, response) => {
    const memberships = await Member.find({ userId: request.user._id }).select(
      "workspaceId"
    );
    const workspaceIds = memberships.map((member) => member.workspaceId);
    const workspaces = await Workspace.find({
      $or: [{ ownerId: request.user._id }, { _id: { $in: workspaceIds } }]
    }).sort({ updatedAt: -1 });

    response.json({
      success: true,
      data: workspaces.map(serialize)
    });
  })
);

router.post(
  "/workspaces",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!request.body.workspaceName?.trim()) {
      response.status(400).json({
        success: false,
        error: "workspaceName is required"
      });
      return;
    }

    const workspace = await Workspace.create({
      workspaceName: request.body.workspaceName.trim(),
      slug: request.body.workspaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ownerId: request.user._id
    });
    const member = await Member.create({
      workspaceId: workspace._id,
      userId: request.user._id,
      role: "owner",
      status: "active"
    });
    workspace.members.push(member._id);
    await workspace.save();

    await createActivity({
      workspaceId: workspace._id,
      actorId: request.user._id,
      action: "workspace.created",
      targetType: "workspace"
    });

    response.status(201).json({
      success: true,
      data: serialize(workspace)
    });
  })
);

router.get(
  "/projects",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const projects = await Project.find({ workspaceId })
      .sort({ updatedAt: -1 })
      .lean();

    response.json({
      success: true,
      data: projects.map(serialize)
    });
  })
);

router.get(
  "/projects/:projectId",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const project = await assertProjectAccess(request, projectId);

    response.json({
      success: true,
      data: serialize(project)
    });
  })
);

router.get(
  "/projects/:projectId/export",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.params.projectId, "projectId");
    const project = await assertProjectAccess(request, projectId);
    const files = await File.find({ projectId }).sort({ path: 1 }).lean();
    const fileName = `${project.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "devwatch-project"}.zip`;

    response.setHeader("Content-Type", "application/zip");
    response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (error) => response.destroy(error));
    archive.pipe(response);

    for (const file of files) {
      const zipPath = file.path.replace(/^\/+/, "");
      if (!zipPath) continue;

      if (file.type === "folder") {
        archive.append("", { name: zipPath.endsWith("/") ? zipPath : `${zipPath}/` });
      } else {
        archive.append(file.content || "", { name: zipPath });
      }
    }

    await createActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: request.user._id,
      action: "project.exported",
      targetType: "project",
      targetId: project._id
    });

    await archive.finalize();
  })
);

router.post(
  "/projects",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.body.workspaceId, "workspaceId");
    await assertWorkspaceWriteAccess(request, workspaceId);
    if (!request.body.projectName?.trim()) {
      response.status(400).json({
        success: false,
        error: "projectName is required"
      });
      return;
    }

    const project = await Project.create({
      workspaceId,
      projectName: request.body.projectName.trim(),
      description: request.body.description || "",
      createdBy: request.user._id,
      members: [request.user._id]
    });

    await createActivity({
      workspaceId,
      projectId: project._id,
      actorId: request.user._id,
      action: "project.created",
      targetType: "project"
    });

    response.status(201).json({
      success: true,
      data: serialize(project)
    });
  })
);

router.get(
  "/dashboard",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = request.query.workspaceId;

    if (!workspaceId) {
      response.json({
        success: true,
        data: {
          counts: {},
          activity: [],
          projects: [],
          reviews: [],
          deployments: [],
          monitoring: [],
          notifications: []
        }
      });
      return;
    }

    requireObjectId(workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const projects = await Project.find({ workspaceId }).sort({ updatedAt: -1 });
    const projectIds = projects.map((project) => project._id);
    const [reviews, deployments, monitoring, notifications, activity, members] =
      await Promise.all([
        AIReview.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(20),
        Deployment.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(20),
        Monitoring.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(20),
        Notification.find({ userId: request.user._id }).sort({ createdAt: -1 }).limit(20),
        Activity.find({ workspaceId }).sort({ createdAt: -1 }).limit(30),
        Member.find({ workspaceId, status: "active" }).populate(
          "userId",
          "name email photoURL"
        )
      ]);

    response.json({
      success: true,
      data: {
        counts: {
          projects: projects.length,
          aiReviews: reviews.length,
          deployments: deployments.length,
          monitoring: monitoring.length,
          notifications: notifications.filter((item) => !item.read).length,
          members: members.length
        },
        projects: projects.map(serialize),
        reviews: reviews.map(serialize),
        deployments: deployments.map(serialize),
        monitoring: monitoring.map(serialize),
        notifications: notifications.map(serialize),
        activity: activity.map(serialize),
        members: members.map(serialize)
      }
    });
  })
);

router.get(
  "/files",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.query.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const files = await File.find({ projectId }).sort({ path: 1 });

    response.json({
      success: true,
      data: files.map(serialize)
    });
  })
);

router.post(
  "/files",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.body.projectId, "projectId");
    const project = await assertProjectWriteAccess(request, projectId);
    const path = normalizePath(request.body.path);

    if (path === "/") {
      response.status(400).json({ success: false, error: "path is required" });
      return;
    }

    if (await File.exists({ projectId, path })) {
      response.status(409).json({
        success: false,
        error: "A file or folder already exists at this path."
      });
      return;
    }

    const parent =
      parentPath(path) === "/"
        ? null
        : await File.findOne({ projectId, path: parentPath(path), type: "folder" });
    if (parentPath(path) !== "/" && !parent) {
      response.status(409).json({
        success: false,
        error: "Parent folder does not exist."
      });
      return;
    }

    const file = await File.create({
      projectId,
      parentId: parent?._id || null,
      name: path.split("/").filter(Boolean).pop() || path,
      path,
      content: request.body.content || "",
      language: request.body.language || languageFromPath(path),
      type: request.body.type || "file",
      size: Buffer.byteLength(request.body.content || ""),
      revision: 1,
      lastEditedBy: request.user._id
    });
    await createVersion(file, "create", request.user._id);

    await createActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: request.user._id,
      action: "file.saved",
      targetType: "file",
      targetId: file._id,
      targetPath: path,
      metadata: {
        language: file.language,
        size: file.size
      }
    });

    response.status(201).json({
      success: true,
      data: serialize(file)
    });
    emitProject(request, projectId, "project:files-changed", {
      action: "create",
      file: serialize(file)
    });
  })
);

router.delete(
  "/files/:fileId",
  requireAuth,
  asyncHandler(async (request, response) => {
    const fileId = requireObjectId(request.params.fileId, "fileId");
    const file = await File.findById(fileId);

    if (!file) {
      const error = new Error("File not found.");
      error.status = 404;
      throw error;
    }

    const project = await assertProjectWriteAccess(request, file.projectId);
    const affected =
      file.type === "folder"
        ? await File.find({
            projectId: file.projectId,
            $or: [
              { _id: file._id },
              { path: { $regex: `^${file.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/` } }
            ]
          })
        : [file];
    for (const item of affected) {
      await createVersion(item, "delete", request.user._id);
    }
    await File.deleteMany({ _id: { $in: affected.map((item) => item._id) } });

    await createActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: request.user._id,
      action: "file.deleted",
      targetType: "file",
      targetId: file._id,
      targetPath: file.path
    });

    response.json({
      success: true,
      data: {
        deleted: affected.map(serialize)
      }
    });
    emitProject(request, project._id, "project:files-changed", {
      action: "delete",
      files: affected.map(serialize)
    });
  })
);

router.get(
  "/chat",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.query.projectId, "projectId");
    await assertProjectAccess(request, projectId);
    const messages = await Chat.find({ projectId })
      .populate("sender", "name email photoURL")
      .sort({ createdAt: 1 })
      .limit(200);

    response.json({ success: true, data: messages.map(serialize) });
  })
);

router.post(
  "/chat",
  requireAuth,
  asyncHandler(async (request, response) => {
    const projectId = requireObjectId(request.body.projectId, "projectId");
    const project = await assertProjectWriteAccess(request, projectId);
    const message = request.body.message?.trim();
    if (!message) {
      response.status(400).json({ success: false, error: "message is required" });
      return;
    }

    const chat = await Chat.create({
      workspaceId: project.workspaceId,
      projectId,
      sender: request.user._id,
      message
    });
    await chat.populate("sender", "name email photoURL");

    await createActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: request.user._id,
      action: "chat.message_sent",
      targetType: "chat",
      targetId: chat._id
    });

    response.status(201).json({ success: true, data: serialize(chat) });
    emitProject(request, projectId, "chat:message", serialize(chat));
  })
);

router.get(
  "/reviews",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const projects = await Project.find({ workspaceId }).select("_id").lean();
    const reviews = await AIReview.find({
      projectId: { $in: projects.map((project) => project._id) }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    response.json({ success: true, data: reviews.map(serialize) });
  })
);

router.get(
  "/deployments",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const deployments = await Deployment.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(100);

    response.json({ success: true, data: deployments.map(serialize) });
  })
);

router.get(
  "/monitoring",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = request.query.workspaceId
      ? requireObjectId(request.query.workspaceId, "workspaceId")
      : null;
    const projectId = request.query.projectId
      ? requireObjectId(request.query.projectId, "projectId")
      : null;

    if (projectId) {
      await assertProjectAccess(request, projectId);
      const monitoring = await Monitoring.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(100);
      response.json({ success: true, data: monitoring.map(serialize) });
      return;
    }

    if (!workspaceId) {
      response.status(400).json({
        success: false,
        error: "workspaceId or projectId is required"
      });
      return;
    }

    await assertWorkspaceAccess(request, workspaceId);
    const projects = await Project.find({ workspaceId }).select("_id").lean();
    const monitoring = await Monitoring.find({
      projectId: { $in: projects.map((project) => project._id) }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    response.json({ success: true, data: monitoring.map(serialize) });
  })
);

router.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (request, response) => {
    const notifications = await Notification.find({ userId: request.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    response.json({ success: true, data: notifications.map(serialize) });
  })
);

router.get(
  "/activities",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const activity = await Activity.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(100);

    response.json({ success: true, data: activity.map(serialize) });
  })
);

router.get(
  "/members",
  requireAuth,
  asyncHandler(async (request, response) => {
    const workspaceId = requireObjectId(request.query.workspaceId, "workspaceId");
    await assertWorkspaceAccess(request, workspaceId);
    const members = await Member.find({ workspaceId, status: { $ne: "removed" } })
      .populate("userId", "name email photoURL")
      .sort({ role: 1, createdAt: 1 });

    response.json({ success: true, data: members.map(serialize) });
  })
);

module.exports = router;
