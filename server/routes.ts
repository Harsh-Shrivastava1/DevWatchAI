import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "./async-handler";
import { isDatabaseConfigured } from "./db";
import { verifyFirebaseToken } from "./firebase";
import { optionalAuth, signSessionToken } from "./middleware/auth";
import {
  AIReviewModel,
  ChatModel,
  FileModel,
  MemberModel,
  MonitoringModel,
  NotificationModel,
  ProjectModel,
  UserModel,
  WorkspaceModel
} from "./models";
import { chatWithAI, fixCode, reviewCode } from "./services/ai";
import { streamProjectZip } from "./services/export";
import { createId, memory, timestamp } from "./store";
import type { AuthUser } from "./types";

export const router = Router();

const roles = ["owner", "admin", "developer", "viewer"] as const;

const loginSchema = z.object({
  idToken: z.string().optional(),
  uid: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  photoURL: z.string().optional()
});

const signupSchema = z.object({
  uid: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  photoURL: z.string().optional()
});

const createWorkspaceSchema = z.object({
  workspaceName: z.string().min(1),
  ownerId: z.string().optional()
});

const inviteSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(roles).default("developer")
});

const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  projectName: z.string().min(1),
  description: z.string().optional(),
  members: z.array(z.string()).optional()
});

const saveFileSchema = z.object({
  id: z.string().optional(),
  fileId: z.string().optional(),
  projectId: z.string().min(1),
  path: z.string().min(1),
  content: z.string().default(""),
  lastEditedBy: z.string().optional()
});

const reviewSchema = z.object({
  projectId: z.string().optional(),
  fileId: z.string().optional(),
  filePath: z.string().optional(),
  code: z.string().optional()
});

const aiFixSchema = z.object({
  code: z.string().min(1)
});

const aiChatSchema = z.object({
  projectId: z.string().optional(),
  question: z.string().min(1),
  context: z.string().optional()
});

const chatSchema = z.object({
  projectId: z.string().min(1),
  sender: z.string().optional(),
  message: z.string().min(1)
});

const monitoringSchema = z.object({
  cpu: z.number().min(0).max(100),
  ram: z.number().min(0).max(100),
  latency: z.number().min(0),
  uptime: z.number().min(0).max(100)
});

const notificationSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1)
});

const exportSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string().default("")
      })
    )
    .optional()
});

import mongoose from "mongoose";

function dbEnabled() {
  return isDatabaseConfigured() && mongoose.connection.readyState === 1;
}

function currentUser(request: { user?: AuthUser }) {
  return (
    request.user ?? {
      uid: "demo-user",
      email: "demo@devwatch.ai",
      name: "Demo User",
      provider: "local" as const
    }
  );
}

function upsertMemoryUser(user: AuthUser) {
  const existing = memory.users.find((item) => item.uid === user.uid);
  const nextUser = {
    uid: user.uid,
    name: user.name ?? existing?.name ?? user.email ?? "DevWatch User",
    email: user.email ?? existing?.email ?? `${user.uid}@devwatch.local`,
    photoURL: user.photoURL ?? existing?.photoURL ?? ""
  };

  if (existing) {
    Object.assign(existing, nextUser);
  } else {
    memory.users.push(nextUser);
  }

  return nextUser;
}

async function persistUser(user: AuthUser) {
  if (!dbEnabled()) {
    return upsertMemoryUser(user);
  }

  return UserModel.findOneAndUpdate(
    { uid: user.uid },
    {
      $set: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    },
    { new: true, upsert: true }
  ).lean();
}

async function resolveLoginUser(input: z.infer<typeof loginSchema>) {
  if (input.idToken) {
    const decoded = await verifyFirebaseToken(input.idToken);
    if (decoded) {
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        photoURL: decoded.picture,
        provider: "firebase" as const
      };
    }
  }

  const uid = input.uid ?? input.email ?? "demo-user";
  return {
    uid,
    email: input.email,
    name: input.name,
    photoURL: input.photoURL,
    provider: "local" as const
  };
}

function getWorkspaceIdsForMemoryUser(userId: string) {
  const memberWorkspaceIds = memory.members
    .filter((member) => member.userId === userId)
    .map((member) => member.workspaceId);

  return memory.workspaces
    .filter(
      (workspace) =>
        workspace.ownerId === userId || memberWorkspaceIds.includes(workspace.id)
    )
    .map((workspace) => workspace.id);
}

router.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "DevWatch AI API",
    database: dbEnabled() ? "mongodb" : "memory",
    timestamp: new Date().toISOString()
  });
});

router.post(
  "/auth/login",
  asyncHandler(async (request, response) => {
    const body = loginSchema.parse(request.body);
    const user = await resolveLoginUser(body);
    const savedUser = await persistUser(user);
    const token = signSessionToken(user);

    response.json({
      token,
      user: savedUser
    });
  })
);

router.post(
  "/auth/signup",
  asyncHandler(async (request, response) => {
    const body = signupSchema.parse(request.body);
    const user = {
      uid: body.uid ?? body.email,
      email: body.email,
      name: body.name,
      photoURL: body.photoURL,
      provider: "local" as const
    };
    const savedUser = await persistUser(user);
    const token = signSessionToken(user);

    response.status(201).json({
      token,
      user: savedUser
    });
  })
);

router.use(optionalAuth);

router.get(
  "/workspaces",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);

    if (dbEnabled()) {
      const memberships = (await MemberModel.find({
        userId: user.uid
      }).lean()) as unknown as Array<{ workspaceId: unknown }>;
      const workspaceIds = memberships.map(
        (membership) => membership.workspaceId
      );
      const workspaces = await WorkspaceModel.find({
        $or: [{ ownerId: user.uid }, { _id: { $in: workspaceIds } }]
      })
        .sort({ updatedAt: -1 })
        .lean();

      response.json(workspaces);
      return;
    }

    response.json(
      memory.workspaces.filter(
        (workspace) =>
          workspace.ownerId === user.uid || workspace.members.includes(user.uid)
      )
    );
  })
);

router.post(
  "/workspaces/create",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const body = createWorkspaceSchema.parse(request.body);
    const ownerId = body.ownerId ?? user.uid;

    if (dbEnabled()) {
      const workspace = await WorkspaceModel.create({
        workspaceName: body.workspaceName,
        ownerId,
        members: []
      });
      const member = await MemberModel.create({
        workspaceId: workspace._id,
        userId: ownerId,
        role: "owner"
      });
      workspace.members.push(member._id);
      await workspace.save();

      response.status(201).json(workspace);
      return;
    }

    const id = createId("workspace");
    const createdAt = timestamp();
    const workspace = {
      id,
      workspaceName: body.workspaceName,
      ownerId,
      members: [ownerId],
      createdAt,
      updatedAt: createdAt
    };

    memory.workspaces.push(workspace);
    memory.members.push({
      id: createId("member"),
      workspaceId: id,
      userId: ownerId,
      role: "owner"
    });

    response.status(201).json(workspace);
  })
);

router.post(
  "/workspaces/invite",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const body = inviteSchema.parse(request.body);

    if (dbEnabled()) {
      const workspace = (await WorkspaceModel.findById(
        body.workspaceId
      ).lean()) as { workspaceName: string } | null;
      if (!workspace) {
        response.status(404).json({ error: "Workspace not found" });
        return;
      }

      await NotificationModel.create({
        userId: body.email,
        message: `${user.name ?? user.email ?? user.uid} invited you to ${workspace.workspaceName}`
      });

      response.status(202).json({
        invite: body,
        status: "queued"
      });
      return;
    }

    const workspace = memory.workspaces.find((item) => item.id === body.workspaceId);
    if (!workspace) {
      response.status(404).json({ error: "Workspace not found" });
      return;
    }

    memory.notifications.push({
      id: createId("notification"),
      userId: body.email,
      message: `${user.name ?? user.email ?? user.uid} invited you to ${workspace.workspaceName}`,
      read: false,
      createdAt: timestamp()
    });

    response.status(202).json({
      invite: body,
      status: "queued"
    });
  })
);

router.get(
  "/projects",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const workspaceId =
      typeof request.query.workspaceId === "string"
        ? request.query.workspaceId
        : undefined;

    if (dbEnabled()) {
      let workspaceIds = workspaceId ? [workspaceId] : [];

      if (!workspaceId) {
        const memberships = (await MemberModel.find({
          userId: user.uid
        }).lean()) as unknown as Array<{ workspaceId: unknown }>;
        workspaceIds = memberships.map((membership) =>
          String(membership.workspaceId)
        );
        const owned = await WorkspaceModel.find({ ownerId: user.uid })
          .select("_id")
          .lean() as Array<{ _id: unknown }>;
        workspaceIds.push(
          ...owned.map((workspace: { _id: unknown }) => String(workspace._id))
        );
      }

      const projects = await ProjectModel.find({
        workspaceId: { $in: workspaceIds }
      })
        .sort({ updatedAt: -1 })
        .lean();

      response.json(projects);
      return;
    }

    const workspaceIds = workspaceId
      ? [workspaceId]
      : getWorkspaceIdsForMemoryUser(user.uid);

    response.json(
      memory.projects.filter((project) =>
        workspaceIds.includes(project.workspaceId)
      )
    );
  })
);

router.post(
  "/projects/create",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const body = createProjectSchema.parse(request.body);

    if (dbEnabled()) {
      const project = await ProjectModel.create({
        workspaceId: body.workspaceId,
        projectName: body.projectName,
        description: body.description ?? "",
        members: body.members ?? [user.uid],
        status: "Healthy",
        aiScore: 0
      });

      await MonitoringModel.create({
        projectId: project._id,
        cpu: 0,
        ram: 0,
        latency: 0,
        uptime: 100
      });

      response.status(201).json(project);
      return;
    }

    const createdAt = timestamp();
    const project = {
      id: createId("project"),
      workspaceId: body.workspaceId,
      projectName: body.projectName,
      description: body.description ?? "",
      members: body.members ?? [user.uid],
      status: "Healthy",
      aiScore: 0,
      createdAt,
      updatedAt: createdAt
    };

    memory.projects.push(project);
    memory.monitoring.push({
      id: createId("monitor"),
      projectId: project.id,
      cpu: 0,
      ram: 0,
      latency: 0,
      uptime: 100,
      createdAt
    });

    response.status(201).json(project);
  })
);

router.delete(
  "/projects/:id",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      await Promise.all([
        ProjectModel.findByIdAndDelete(request.params.id),
        FileModel.deleteMany({ projectId: request.params.id }),
        ChatModel.deleteMany({ projectId: request.params.id }),
        AIReviewModel.deleteMany({ projectId: request.params.id }),
        MonitoringModel.deleteMany({ projectId: request.params.id })
      ]);

      response.json({ deleted: true, id: request.params.id });
      return;
    }

    memory.projects = memory.projects.filter(
      (project) => project.id !== request.params.id
    );
    memory.files = memory.files.filter(
      (file) => file.projectId !== request.params.id
    );
    memory.chats = memory.chats.filter(
      (chat) => chat.projectId !== request.params.id
    );
    memory.aiReviews = memory.aiReviews.filter(
      (review) => review.projectId !== request.params.id
    );
    memory.monitoring = memory.monitoring.filter(
      (monitor) => monitor.projectId !== request.params.id
    );

    response.json({ deleted: true, id: request.params.id });
  })
);

router.get(
  "/files/:projectId",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      const files = await FileModel.find({ projectId: request.params.projectId })
        .sort({ path: 1 })
        .lean();
      response.json({ projectId: request.params.projectId, files });
      return;
    }

    response.json({
      projectId: request.params.projectId,
      files: memory.files.filter(
        (file) => file.projectId === request.params.projectId
      )
    });
  })
);

router.post(
  "/files/save",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const body = saveFileSchema.parse(request.body);
    const fileId = body.fileId ?? body.id;
    const lastEditedBy = body.lastEditedBy ?? user.uid;

    if (dbEnabled()) {
      const update = {
        projectId: body.projectId,
        path: body.path,
        content: body.content,
        lastEditedBy
      };
      const file = fileId
        ? await FileModel.findByIdAndUpdate(fileId, { $set: update }, { new: true })
        : await FileModel.findOneAndUpdate(
            { projectId: body.projectId, path: body.path },
            { $set: update },
            { new: true, upsert: true }
          );

      response.json({
        saved: true,
        file,
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const existing = fileId
      ? memory.files.find((file) => file.id === fileId)
      : memory.files.find(
          (file) => file.projectId === body.projectId && file.path === body.path
        );
    const updatedAt = timestamp();

    if (existing) {
      Object.assign(existing, {
        path: body.path,
        content: body.content,
        lastEditedBy,
        updatedAt
      });
      response.json({ saved: true, file: existing, updatedAt });
      return;
    }

    const file = {
      id: createId("file"),
      projectId: body.projectId,
      path: body.path,
      content: body.content,
      lastEditedBy,
      createdAt: updatedAt,
      updatedAt
    };
    memory.files.push(file);

    response.status(201).json({ saved: true, file, updatedAt });
  })
);

router.delete(
  "/files/:id",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      await FileModel.findByIdAndDelete(request.params.id);
      response.json({ deleted: true, id: request.params.id });
      return;
    }

    memory.files = memory.files.filter((file) => file.id !== request.params.id);
    response.json({ deleted: true, id: request.params.id });
  })
);

router.post(
  "/ai/review",
  asyncHandler(async (request, response) => {
    const body = reviewSchema.parse(request.body);
    let code = body.code;

    if (!code && body.fileId) {
      if (dbEnabled()) {
        const file = (await FileModel.findById(body.fileId).lean()) as {
          content?: string;
        } | null;
        code = file?.content;
      } else {
        code = memory.files.find((file) => file.id === body.fileId)?.content;
      }
    }

    const result = await reviewCode({
      code: code ?? "",
      filePath: body.filePath
    });

    if (body.projectId) {
      if (dbEnabled()) {
        await AIReviewModel.create({
          projectId: body.projectId,
          fileId: body.fileId,
          score: result.score,
          issues: result.issues,
          summary: result.summary
        });
        await ProjectModel.findByIdAndUpdate(body.projectId, {
          $set: { aiScore: result.score }
        });
      } else {
        memory.aiReviews.push({
          id: createId("review"),
          projectId: body.projectId,
          fileId: body.fileId,
          score: result.score,
          issues: result.issues,
          summary: result.summary,
          createdAt: timestamp()
        });
        const project = memory.projects.find(
          (item) => item.id === body.projectId
        );
        if (project) {
          project.aiScore = result.score;
          project.updatedAt = timestamp();
        }
      }
    }

    response.json(result);
  })
);

router.post(
  "/ai/fix",
  asyncHandler(async (request, response) => {
    const body = aiFixSchema.parse(request.body);
    response.json(await fixCode(body.code));
  })
);

router.post(
  "/ai/chat",
  asyncHandler(async (request, response) => {
    const body = aiChatSchema.parse(request.body);
    response.json(await chatWithAI(body));
  })
);

router.get(
  "/chat/:projectId",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      const messages = await ChatModel.find({ projectId: request.params.projectId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();
      response.json({ projectId: request.params.projectId, messages });
      return;
    }

    response.json({
      projectId: request.params.projectId,
      messages: memory.chats.filter(
        (chat) => chat.projectId === request.params.projectId
      )
    });
  })
);

router.post(
  "/chat/send",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const body = chatSchema.parse(request.body);

    if (dbEnabled()) {
      const message = await ChatModel.create({
        projectId: body.projectId,
        sender: body.sender ?? user.name ?? user.email ?? user.uid,
        message: body.message
      });

      response.status(201).json(message);
      return;
    }

    const message = {
      id: createId("chat"),
      projectId: body.projectId,
      sender: body.sender ?? user.name ?? user.email ?? user.uid,
      message: body.message,
      createdAt: timestamp()
    };
    memory.chats.push(message);

    response.status(201).json(message);
  })
);

router.get(
  "/monitoring/:projectId",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      const metrics = await MonitoringModel.findOne({
        projectId: request.params.projectId
      })
        .sort({ createdAt: -1 })
        .lean();
      response.json(
        metrics ?? {
          projectId: request.params.projectId,
          cpu: 0,
          ram: 0,
          latency: 0,
          uptime: 100
        }
      );
      return;
    }

    const metrics = [...memory.monitoring]
      .reverse()
      .find((item) => item.projectId === request.params.projectId);

    response.json(
      metrics ?? {
        projectId: request.params.projectId,
        cpu: 0,
        ram: 0,
        latency: 0,
        uptime: 100
      }
    );
  })
);

router.post(
  "/monitoring/:projectId",
  asyncHandler(async (request, response) => {
    const body = monitoringSchema.parse(request.body);

    if (dbEnabled()) {
      const metric = await MonitoringModel.create({
        projectId: request.params.projectId,
        ...body
      });
      response.status(201).json(metric);
      return;
    }

    const metric = {
      id: createId("monitor"),
      projectId: request.params.projectId,
      ...body,
      createdAt: timestamp()
    };
    memory.monitoring.push(metric);

    response.status(201).json(metric);
  })
);

router.get(
  "/notifications",
  asyncHandler(async (request, response) => {
    const user = currentUser(request);
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : user.uid;

    if (dbEnabled()) {
      const notifications = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      response.json(notifications);
      return;
    }

    response.json(
      memory.notifications
        .filter((notification) => notification.userId === userId)
        .slice()
        .reverse()
    );
  })
);

router.post(
  "/notifications",
  asyncHandler(async (request, response) => {
    const body = notificationSchema.parse(request.body);

    if (dbEnabled()) {
      const notification = await NotificationModel.create({
        userId: body.userId,
        message: body.message,
        read: false
      });
      response.status(201).json(notification);
      return;
    }

    const notification = {
      id: createId("notification"),
      userId: body.userId,
      message: body.message,
      read: false,
      createdAt: timestamp()
    };
    memory.notifications.push(notification);

    response.status(201).json(notification);
  })
);

router.post(
  "/notifications/:id/read",
  asyncHandler(async (request, response) => {
    if (dbEnabled()) {
      const notification = await NotificationModel.findByIdAndUpdate(
        request.params.id,
        { $set: { read: true } },
        { new: true }
      );
      response.json(notification);
      return;
    }

    const notification = memory.notifications.find(
      (item) => item.id === request.params.id
    );
    if (notification) {
      notification.read = true;
    }

    response.json(notification ?? { id: request.params.id, read: true });
  })
);

router.post(
  "/export/:projectId",
  asyncHandler(async (request, response) => {
    const body = exportSchema.parse(request.body ?? {});
    let files = body.files;

    if (!files?.length) {
      if (dbEnabled()) {
        const projectFiles = (await FileModel.find({
          projectId: request.params.projectId
        }).lean()) as unknown as Array<{ path: string; content: string }>;
        files = projectFiles.map((file) => ({
          path: file.path,
          content: file.content
        }));
      } else {
        files = memory.files
          .filter((file) => file.projectId === request.params.projectId)
          .map((file) => ({
            path: file.path,
            content: file.content
          }));
      }
    }

    const project =
      memory.projects.find((item) => item.id === request.params.projectId)
        ?.projectName ?? request.params.projectId;

    streamProjectZip(response, project, files ?? []);
  })
);
