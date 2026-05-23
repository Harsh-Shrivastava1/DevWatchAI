import { randomUUID } from "node:crypto";
import type { Role } from "./types";

export type StoredUser = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
};

export type StoredWorkspace = {
  id: string;
  workspaceName: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
};

export type StoredMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
};

export type StoredProject = {
  id: string;
  workspaceId: string;
  projectName: string;
  description: string;
  members: string[];
  status: string;
  aiScore: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredFile = {
  id: string;
  projectId: string;
  path: string;
  content: string;
  lastEditedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredChat = {
  id: string;
  projectId: string;
  sender: string;
  message: string;
  createdAt: string;
};

export type StoredAIReview = {
  id: string;
  projectId: string;
  fileId?: string;
  score: number;
  issues: unknown[];
  summary: string;
  createdAt: string;
};

export type StoredMonitoring = {
  id: string;
  projectId: string;
  cpu: number;
  ram: number;
  latency: number;
  uptime: number;
  createdAt: string;
};

export type StoredNotification = {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function now() {
  return new Date().toISOString();
}

const createdAt = now();

export const memory = {
  users: [
    {
      uid: "demo-user",
      name: "Harsh Sharma",
      email: "demo@devwatch.ai",
      photoURL: ""
    }
  ] satisfies StoredUser[],
  workspaces: [
    {
      id: "codedwaves",
      workspaceName: "CodedWaves",
      ownerId: "demo-user",
      members: ["demo-user", "rahul", "priya"],
      createdAt,
      updatedAt: createdAt
    }
  ] satisfies StoredWorkspace[],
  members: [
    {
      id: "member-owner",
      workspaceId: "codedwaves",
      userId: "demo-user",
      role: "owner"
    },
    {
      id: "member-rahul",
      workspaceId: "codedwaves",
      userId: "rahul",
      role: "developer"
    },
    {
      id: "member-priya",
      workspaceId: "codedwaves",
      userId: "priya",
      role: "admin"
    }
  ] satisfies StoredMember[],
  projects: [
    {
      id: "frontend",
      workspaceId: "codedwaves",
      projectName: "Frontend",
      description: "Next.js customer workspace with cloud editor shell.",
      members: ["demo-user", "rahul", "priya"],
      status: "Healthy",
      aiScore: 94,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: "backend",
      workspaceId: "codedwaves",
      projectName: "Backend API",
      description: "Express, Socket.io, MongoDB, auth, export, and AI routes.",
      members: ["demo-user", "rahul"],
      status: "Reviewing",
      aiScore: 86,
      createdAt,
      updatedAt: createdAt
    }
  ] satisfies StoredProject[],
  files: [
    {
      id: "file-app",
      projectId: "frontend",
      path: "/src/app.tsx",
      content:
        "export function App() {\n  return <main>DevWatch AI workspace</main>;\n}\n",
      lastEditedBy: "demo-user",
      createdAt,
      updatedAt: createdAt
    },
    {
      id: "file-server",
      projectId: "backend",
      path: "/server/index.ts",
      content:
        "import express from \"express\";\n\nexport const app = express();\n",
      lastEditedBy: "rahul",
      createdAt,
      updatedAt: createdAt
    }
  ] satisfies StoredFile[],
  chats: [
    {
      id: "chat-1",
      projectId: "frontend",
      sender: "Rahul",
      message: "Fix API issue",
      createdAt
    }
  ] satisfies StoredChat[],
  aiReviews: [
    {
      id: "review-1",
      projectId: "frontend",
      fileId: "file-app",
      score: 89,
      issues: [],
      summary: "Project is healthy with minor optimization opportunities.",
      createdAt
    }
  ] as StoredAIReview[],
  monitoring: [
    {
      id: "monitor-1",
      projectId: "frontend",
      cpu: 40,
      ram: 70,
      latency: 120,
      uptime: 99.98,
      createdAt
    }
  ] satisfies StoredMonitoring[],
  notifications: [
    {
      id: "notification-1",
      userId: "demo-user",
      message: "Rahul mentioned you",
      read: false,
      createdAt
    },
    {
      id: "notification-2",
      userId: "demo-user",
      message: "AI detected security issue",
      read: false,
      createdAt
    }
  ] as StoredNotification[]
};

export function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export function timestamp() {
  return now();
}
