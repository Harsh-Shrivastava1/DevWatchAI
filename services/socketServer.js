const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { Project, User } = require("../models");
const { getWorkspaceAccess } = require("./platformUtils");

const projectPresence = new Map();

function createSocketServer(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true
    },
    maxHttpBufferSize: 2 * 1024 * 1024
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        String(socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) throw new Error("Authentication required.");
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "devwatch-local-secret"
      );
      const user = await User.findById(payload.userId).select("name email photoURL");
      if (!user) throw new Error("Session user no longer exists.");
      socket.data.user = user;
      socket.data.projects = new Set();
      next();
    } catch (error) {
      next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("project:join", async ({ projectId }, acknowledgement) => {
      try {
        const project = await Project.findById(projectId).select("workspaceId");
        if (!project) throw new Error("Project not found.");
        await getWorkspaceAccess(socket.data.user._id, project.workspaceId);
        socket.join(`project:${projectId}`);
        socket.data.projects.add(String(projectId));
        updatePresence(socket, projectId, {
          fileId: null,
          filePath: "",
          cursor: null,
          editing: false
        });
        broadcastPresence(io, projectId);
        acknowledgement?.({ success: true });
      } catch (error) {
        acknowledgement?.({ success: false, error: error.message });
      }
    });

    socket.on("project:leave", ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      socket.data.projects.delete(String(projectId));
      removePresence(socket.id, projectId);
      broadcastPresence(io, projectId);
    });

    socket.on("presence:file", (payload) => {
      if (!isJoined(socket, payload.projectId)) return;
      updatePresence(socket, payload.projectId, {
        fileId: payload.fileId || null,
        filePath: payload.filePath || "",
        cursor: payload.cursor || null,
        editing: Boolean(payload.editing)
      });
      broadcastPresence(io, payload.projectId);
    });

    socket.on("file:change", (payload) => {
      if (!isJoined(socket, payload.projectId)) return;
      socket.to(`project:${payload.projectId}`).emit("file:change", {
        fileId: payload.fileId,
        path: payload.path,
        content: payload.content,
        revision: payload.revision,
        userId: String(socket.data.user._id),
        updatedAt: new Date().toISOString()
      });
    });

    socket.on("file:save-status", (payload) => {
      if (!isJoined(socket, payload.projectId)) return;
      socket.to(`project:${payload.projectId}`).emit("file:save-status", {
        fileId: payload.fileId,
        status: payload.status,
        userId: String(socket.data.user._id),
        updatedAt: new Date().toISOString()
      });
    });

    socket.on("chat:typing", (payload) => {
      if (!isJoined(socket, payload.projectId)) return;
      socket.to(`project:${payload.projectId}`).emit("chat:typing", {
        userId: String(socket.data.user._id),
        name: socket.data.user.name || socket.data.user.email,
        typing: Boolean(payload.typing)
      });
    });

    socket.on("disconnect", () => {
      for (const projectId of socket.data.projects || []) {
        removePresence(socket.id, projectId);
        broadcastPresence(io, projectId);
      }
    });
  });

  return io;
}

function updatePresence(socket, projectId, update) {
  const key = String(projectId);
  if (!projectPresence.has(key)) projectPresence.set(key, new Map());
  projectPresence.get(key).set(socket.id, {
    socketId: socket.id,
    userId: String(socket.data.user._id),
    name: socket.data.user.name || socket.data.user.email,
    email: socket.data.user.email,
    photoURL: socket.data.user.photoURL || "",
    fileId: update.fileId,
    filePath: update.filePath,
    cursor: update.cursor,
    editing: update.editing,
    lastActiveAt: new Date().toISOString()
  });
}

function removePresence(socketId, projectId) {
  const key = String(projectId);
  projectPresence.get(key)?.delete(socketId);
  if (projectPresence.get(key)?.size === 0) projectPresence.delete(key);
}

function broadcastPresence(io, projectId) {
  const entries = [...(projectPresence.get(String(projectId))?.values() || [])];
  io.to(`project:${projectId}`).emit("presence:list", entries);
}

function isJoined(socket, projectId) {
  return socket.data.projects?.has(String(projectId));
}

function getProjectPresence(projectId) {
  return [...(projectPresence.get(String(projectId))?.values() || [])];
}

module.exports = {
  createSocketServer,
  getProjectPresence
};
