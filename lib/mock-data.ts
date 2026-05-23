import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  BrainCircuit,
  Braces,
  Bug,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileCode2,
  Gauge,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Lock,
  MessageSquare,
  MonitorDot,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppView =
  | "landing"
  | "overview"
  | "projects"
  | "pull-requests"
  | "reviews"
  | "deployments"
  | "monitoring"
  | "alerts"
  | "analytics"
  | "team"
  | "integrations"
  | "settings"
  | "notifications"
  | "ide";

export type MemberStatus = "online" | "coding" | "reviewing" | "viewer";
export type Role = "Owner" | "Admin" | "Developer" | "Viewer";

export type Member = {
  name: string;
  role: Role;
  status: MemberStatus;
  email: string;
  color: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Healthy" | "Reviewing" | "Deploying" | "Warning";
  aiScore: number;
  lastEdited: string;
  members: string[];
  language: string;
  deployments: number;
};

export type WorkspaceFile = {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  editedBy: string;
};

export type ChatMessage = {
  sender: string;
  message: string;
  time: string;
};

export type ActivityItem = {
  person: string;
  action: string;
  target: string;
  time: string;
  icon: LucideIcon;
};

export type ReviewIssue = {
  type: "Security" | "Performance" | "Bug" | "Clean Code";
  title: string;
  file: string;
  severity: "Low" | "Medium" | "High";
};

export const workspace = {
  name: "CodedWaves",
  activeProjects: 12,
  deployments: 48,
  aiReviews: 134,
  onlineUsers: 8,
  uptime: "99.98%",
  latency: 120
};

export const members: Member[] = [
  {
    name: "Harsh Sharma",
    role: "Owner",
    status: "online",
    email: "harsh@codedwaves.dev",
    color: "bg-violet-600"
  },
  {
    name: "Rahul Mehta",
    role: "Developer",
    status: "coding",
    email: "rahul@codedwaves.dev",
    color: "bg-sky-600"
  },
  {
    name: "Priya Rao",
    role: "Admin",
    status: "reviewing",
    email: "priya@codedwaves.dev",
    color: "bg-emerald-600"
  },
  {
    name: "Anaya Sen",
    role: "Viewer",
    status: "viewer",
    email: "anaya@codedwaves.dev",
    color: "bg-amber-600"
  }
];

export const projects: Project[] = [
  {
    id: "frontend",
    name: "Frontend",
    description: "Next.js customer workspace with cloud editor shell.",
    status: "Healthy",
    aiScore: 94,
    lastEdited: "4 min ago",
    members: ["Harsh", "Rahul", "Priya"],
    language: "TypeScript",
    deployments: 24
  },
  {
    id: "backend",
    name: "Backend API",
    description: "Express, Socket.io, MongoDB, auth, export, AI routes.",
    status: "Reviewing",
    aiScore: 86,
    lastEdited: "18 min ago",
    members: ["Harsh", "Rahul"],
    language: "Node.js",
    deployments: 16
  },
  {
    id: "ai-dashboard",
    name: "AI Dashboard",
    description: "AI review history, risk summaries, and issue workflows.",
    status: "Warning",
    aiScore: 78,
    lastEdited: "42 min ago",
    members: ["Priya", "Anaya"],
    language: "Python",
    deployments: 8
  }
];

export const files: WorkspaceFile[] = [
  {
    id: "app-shell",
    name: "app.tsx",
    path: "/src/app.tsx",
    language: "typescript",
    editedBy: "Harsh",
    content: [
      "type ProjectHealth = {",
      "  latency: number;",
      "  errorRate: number;",
      "  aiScore: number;",
      "};",
      "",
      "export function summarizeHealth(health: ProjectHealth) {",
      "  const risk = health.errorRate > 2 || health.aiScore < 80;",
      "",
      "  return {",
      "    status: risk ? \"needs-review\" : \"healthy\",",
      "    message: risk",
      "      ? \"AI recommends reviewing this service before deploy.\"",
      "      : \"Workspace health is stable.\"",
      "  };",
      "}"
    ].join("\n")
  },
  {
    id: "socket",
    name: "collaboration.ts",
    path: "/src/realtime/collaboration.ts",
    language: "typescript",
    editedBy: "Rahul",
    content: [
      "import { io } from \"socket.io-client\";",
      "",
      "export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {",
      "  autoConnect: false,",
      "  transports: [\"websocket\"]",
      "});",
      "",
      "export function joinProject(projectId: string) {",
      "  socket.connect();",
      "  socket.emit(\"project:join\", { projectId });",
      "}"
    ].join("\n")
  },
  {
    id: "review",
    name: "review.prompt.ts",
    path: "/src/ai/review.prompt.ts",
    language: "typescript",
    editedBy: "Priya",
    content: [
      "export const reviewSystemPrompt = `",
      "You are DevWatch AI. Review the submitted code for bugs, security,",
      "performance, and maintainability. Return strict JSON with score,",
      "issues, suggestions, and patch candidates.",
      "`;"
    ].join("\n")
  },
  {
    id: "monitoring",
    name: "monitoring.json",
    path: "/config/monitoring.json",
    language: "json",
    editedBy: "Anaya",
    content: JSON.stringify(
      {
        projectId: "frontend",
        cpu: 40,
        ram: 70,
        latency: 120,
        uptime: 99.98
      },
      null,
      2
    )
  }
];

export const chatMessages: ChatMessage[] = [
  {
    sender: "Rahul",
    message: "Fixing the API retry path now.",
    time: "10:24"
  },
  {
    sender: "Harsh",
    message: "Deploying the latest build after AI review.",
    time: "10:26"
  },
  {
    sender: "Priya",
    message: "One auth warning left in review history.",
    time: "10:28"
  }
];

export const activityFeed: ActivityItem[] = [
  {
    person: "Harsh",
    action: "edited",
    target: "/src/app.tsx",
    time: "2 min ago",
    icon: FileCode2
  },
  {
    person: "Rahul",
    action: "deployed",
    target: "Backend API",
    time: "9 min ago",
    icon: Rocket
  },
  {
    person: "Priya",
    action: "resolved",
    target: "authentication warning",
    time: "15 min ago",
    icon: ShieldCheck
  },
  {
    person: "Anaya",
    action: "commented in",
    target: "#ai-review",
    time: "21 min ago",
    icon: MessageSquare
  }
];

export const reviewIssues: ReviewIssue[] = [
  {
    type: "Performance",
    title: "Memoize expensive project filtering",
    file: "/src/dashboard/projects.tsx",
    severity: "Medium"
  },
  {
    type: "Security",
    title: "Validate invite role before persisting member",
    file: "/server/routes/workspaces.ts",
    severity: "High"
  },
  {
    type: "Clean Code",
    title: "Extract repeated activity row markup",
    file: "/src/components/activity.tsx",
    severity: "Low"
  }
];

export const analyticsSeries = [
  { name: "Mon", activity: 72, deploys: 4, score: 86, bugs: 8 },
  { name: "Tue", activity: 84, deploys: 7, score: 88, bugs: 6 },
  { name: "Wed", activity: 78, deploys: 5, score: 91, bugs: 5 },
  { name: "Thu", activity: 91, deploys: 9, score: 89, bugs: 4 },
  { name: "Fri", activity: 96, deploys: 8, score: 94, bugs: 3 },
  { name: "Sat", activity: 64, deploys: 3, score: 92, bugs: 2 }
];

export const monitoringSeries = [
  { time: "09:00", cpu: 32, ram: 58, latency: 118 },
  { time: "10:00", cpu: 40, ram: 63, latency: 122 },
  { time: "11:00", cpu: 48, ram: 68, latency: 128 },
  { time: "12:00", cpu: 55, ram: 72, latency: 136 },
  { time: "13:00", cpu: 46, ram: 69, latency: 121 },
  { time: "14:00", cpu: 38, ram: 64, latency: 116 }
];

export const featureCards = [
  {
    title: "Cloud IDE",
    description: "Browser coding with files, folders, tabs, save, run, deploy, and export.",
    icon: Code2
  },
  {
    title: "AI Code Review",
    description: "Structured bug, security, performance, and clean code analysis.",
    icon: BrainCircuit
  },
  {
    title: "Team Collaboration",
    description: "Rooms, chat, typing state, online presence, and shared project activity.",
    icon: Users
  },
  {
    title: "Monitoring",
    description: "CPU, RAM, latency, uptime, traffic, and operational alerts.",
    icon: MonitorDot
  },
  {
    title: "Analytics",
    description: "Productivity, deployment history, AI score trends, and bug rates.",
    icon: BarChart3
  },
  {
    title: "Export Anywhere",
    description: "Download a full ZIP so teams can deploy or upload manually.",
    icon: GitBranch
  }
];

export const navItems: Array<{
  label: string;
  view: AppView;
  icon: LucideIcon;
}> = [
  { label: "Overview", view: "overview", icon: LayoutDashboard },
  { label: "Projects", view: "projects", icon: Braces },
  { label: "AI Reviews", view: "reviews", icon: Bot },
  { label: "Monitoring", view: "monitoring", icon: Cpu },
  { label: "Analytics", view: "analytics", icon: LineChart },
  { label: "Team", view: "team", icon: Users },
  { label: "Notifications", view: "notifications", icon: Activity },
  { label: "Settings", view: "settings", icon: Gauge }
];

export const notifications = [
  { title: "Rahul mentioned you", detail: "Backend API retry flow", icon: MessageSquare },
  { title: "AI detected security issue", detail: "/server/routes/workspaces.ts", icon: AlertTriangle },
  { title: "New member joined", detail: "Anaya joined as Viewer", icon: Users },
  { title: "Deployment succeeded", detail: "Frontend production build", icon: CheckCircle2 }
];

export const aiInsights = [
  { label: "Risky files", value: "3", icon: AlertTriangle },
  { label: "Security warnings", value: "1", icon: Lock },
  { label: "Slow paths", value: "2", icon: Zap },
  { label: "Bug candidates", value: "4", icon: Bug },
  { label: "Data models", value: "8", icon: Database },
  { label: "Review score", value: "89", icon: Sparkles }
];
