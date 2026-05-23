import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

export function createRealtimeServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("user:join", ({ userId }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on("workspace:join", ({ workspaceId }) => {
      if (!workspaceId) return;
      socket.join(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit("presence:update", {
        socketId: socket.id,
        status: "online"
      });
    });

    socket.on("project:join", ({ projectId }) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit("project:member-joined", {
        socketId: socket.id,
        joinedAt: new Date().toISOString()
      });
    });

    socket.on("file:update", ({ projectId, fileId, content, user }) => {
      if (!projectId || !fileId) return;
      socket.to(`project:${projectId}`).emit("file:updated", {
        fileId,
        content,
        user,
        updatedAt: new Date().toISOString()
      });
    });

    socket.on("chat:send", ({ projectId, message }) => {
      if (!projectId || !message) return;
      io.to(`project:${projectId}`).emit("chat:message", {
        ...message,
        createdAt: new Date().toISOString()
      });
    });

    socket.on("typing:start", ({ projectId, user }) => {
      if (!projectId) return;
      socket.to(`project:${projectId}`).emit("typing:update", {
        user,
        typing: true
      });
    });

    socket.on("typing:stop", ({ projectId, user }) => {
      if (!projectId) return;
      socket.to(`project:${projectId}`).emit("typing:update", {
        user,
        typing: false
      });
    });

    socket.on("notification:send", ({ userId, notification }) => {
      if (!userId || !notification) return;
      io.to(`user:${userId}`).emit("notification:new", notification);
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("workspace:")) {
          socket.to(room).emit("presence:update", {
            socketId: socket.id,
            status: "offline"
          });
        }
      }
    });
  });

  return io;
}
