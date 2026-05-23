"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  Cpu,
  Download,
  Gauge,
  MailPlus,
  MessageSquare,
  Plus,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  GitPullRequest,
  ChevronDown,
  Bug,
  Lock,
  Zap,
  Smile,
  Paperclip,
  Send,
  Search
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge, Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import {
  activityFeed,
  aiInsights,
  analyticsSeries,
  members,
  monitoringSeries,
  notifications,
  projects,
  reviewIssues,
  workspace
} from "@/lib/mock-data";
import type { Project, ReviewIssue } from "@/lib/mock-data";
import { cn, formatNumber, initials } from "@/lib/utils";

const statusTone: Record<Project["status"], "green" | "amber" | "blue" | "violet"> = {
  Healthy: "green",
  Reviewing: "violet",
  Deploying: "blue",
  Warning: "amber"
};

const severityTone: Record<ReviewIssue["severity"], "green" | "amber" | "red"> = {
  Low: "green",
  Medium: "amber",
  High: "red"
};

export function DashboardOverview({
  onOpenProject
}: {
  onOpenProject: (projectId: string) => void;
}) {
  const stats = [
    {
      label: "Active Projects",
      value: "24",
      change: "↑ 12% from last week",
      changeType: "up",
      icon: Code2,
      tone: "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
    },
    {
      label: "Open Pull Requests",
      value: "17",
      change: "↑ 8% from last week",
      changeType: "up",
      icon: GitPullRequest,
      tone: "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
    },
    {
      label: "Deployments",
      value: "32",
      change: "↑ 24% from last week",
      changeType: "up",
      icon: Rocket,
      tone: "bg-sky-50 text-sky-600 border border-sky-100/50"
    },
    {
      label: "Alerts",
      value: "3",
      change: "↓ 25% from last week",
      changeType: "down",
      icon: AlertTriangle,
      tone: "bg-rose-50 text-rose-600 border border-rose-100/50"
    }
  ];

  const devActivityData = [
    { name: "Mon", commits: 70, prs: 50, reviews: 20 },
    { name: "Tue", commits: 60, prs: 40, reviews: 25 },
    { name: "Wed", commits: 90, prs: 65, reviews: 22 },
    { name: "Thu", commits: 105, prs: 70, reviews: 30 },
    { name: "Fri", commits: 75, prs: 55, reviews: 28 },
    { name: "Sat", commits: 65, prs: 45, reviews: 18 },
    { name: "Sun", commits: 80, prs: 50, reviews: 26 },
  ];

  const insights = [
    {
      title: "18 potential bugs detected",
      description: "Across 7 projects",
      icon: Bug,
      tone: "bg-amber-50 text-amber-600 border-amber-100/50"
    },
    {
      title: "Code quality improved",
      description: "14% vs last week",
      icon: Sparkles,
      tone: "bg-emerald-50 text-emerald-600 border-emerald-100/50"
    },
    {
      title: "Performance issue",
      description: "API response time high in 2 services",
      icon: Zap,
      tone: "bg-rose-50 text-rose-600 border-rose-100/50"
    },
    {
      title: "Security vulnerability",
      description: "1 critical vulnerability found",
      icon: Lock,
      tone: "bg-indigo-50 text-indigo-600 border-indigo-100/50"
    }
  ];

  const recentPRs = [
    {
      title: "feat: add real-time analytics",
      meta: "#142 • acme/web-app",
      badge: "Review",
      badgeStyle: "bg-blue-50 text-blue-600 border border-blue-100",
      time: "2m ago",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      title: "fix: resolve login issue",
      meta: "#141 • acme/web-app",
      badge: "Approved",
      badgeStyle: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      time: "15m ago",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      title: "refactor: improve data fetching",
      meta: "#140 • acme/api",
      badge: "Changes requested",
      badgeStyle: "bg-rose-50 text-rose-600 border border-rose-100",
      time: "1h ago",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      title: "chore: update dependencies",
      meta: "#139 • acme/dashboard",
      badge: "Merged",
      badgeStyle: "bg-purple-50 text-purple-600 border border-purple-100",
      time: "3h ago",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80"
    }
  ];

  const recentDeploys = [
    {
      name: "acme/web-app",
      env: "Production",
      status: "Success",
      statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      time: "2m ago"
    },
    {
      name: "acme/api",
      env: "Staging",
      status: "Success",
      statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      time: "15m ago"
    },
    {
      name: "acme/worker",
      env: "Production",
      status: "Failed",
      statusStyle: "bg-rose-50 text-rose-600 border border-rose-100",
      time: "1h ago"
    },
    {
      name: "acme/dashboard",
      env: "Staging",
      status: "Success",
      statusStyle: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      time: "3h ago"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-sans">Good morning, Harsh 👋</h1>
        <p className="text-sm font-medium text-neutral-500 mt-1">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</span>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.tone)}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-neutral-900">{stat.value}</span>
                <div className="mt-1 flex items-center gap-1">
                  <span className={cn("text-xs font-bold", stat.changeType === "up" ? "text-emerald-500" : "text-rose-500")}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity Chart & AI Insights */}
      <div className="grid gap-6 lg:grid-cols-[1.60fr_0.90fr]">
        {/* Chart Card */}
        <Card className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Development Activity</h3>
              {/* Legends */}
              <div className="flex items-center gap-4 mt-2.5">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span>Commits</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>PRs</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Reviews</span>
                </div>
              </div>
            </div>
            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm cursor-pointer hover:bg-neutral-50">
              <span>Last 7 days</span>
              <ChevronDown size={12} className="text-neutral-400" />
            </div>
          </div>

          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={devActivityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="commitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="prsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f7" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }} domain={[0, 120]} ticks={[0, 30, 60, 90, 120]} />
                <Tooltip />
                <Area type="monotone" dataKey="commits" stroke="#6366f1" strokeWidth={2} fill="url(#commitsGradient)" />
                <Area type="monotone" dataKey="prs" stroke="#3b82f6" strokeWidth={2} fill="url(#prsGradient)" />
                <Area type="monotone" dataKey="reviews" stroke="#10b981" strokeWidth={2} fill="url(#reviewsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insights Card */}
        <Card className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-neutral-900 text-sm tracking-tight">AI Insights</h3>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">View all</button>
          </div>

          <div className="space-y-4">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div key={idx} className="flex items-center gap-4 rounded-xl border border-neutral-100/50 p-3.5 hover:bg-neutral-50/50 transition duration-200">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", insight.tone)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{insight.title}</h4>
                    <p className="text-[10.5px] font-medium text-neutral-400 mt-0.5">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Pull Requests & Deployments Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Pull Requests */}
        <Card className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Recent Pull Requests</h3>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">View all</button>
          </div>

          <div className="space-y-4">
            {recentPRs.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-50 p-3.5 hover:bg-neutral-50/50 transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img src={pr.avatar} alt="Author" className="h-8.5 w-8.5 rounded-full object-cover border border-neutral-100" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">{pr.title}</h4>
                    <p className="text-[10px] font-medium text-neutral-400 truncate mt-0.5">{pr.meta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("rounded-lg px-2 py-0.5 text-[9.5px] font-bold tracking-tight", pr.badgeStyle)}>
                    {pr.badge}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400">{pr.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Deployments */}
        <Card className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Recent Deployments</h3>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">View all</button>
          </div>

          <div className="space-y-4">
            {recentDeploys.map((deploy, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-50 p-3.5 hover:bg-neutral-50/50 transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400 border border-neutral-100/50">
                    <Rocket size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">{deploy.name}</h4>
                    <p className="text-[10px] font-medium text-neutral-400 truncate mt-0.5">{deploy.env}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("rounded-lg px-2 py-0.5 text-[9.5px] font-bold tracking-tight", deploy.statusStyle)}>
                    {deploy.status}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400">{deploy.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card className="p-6 bg-white border border-neutral-100/70 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-neutral-900 text-sm tracking-tight">System Health</h3>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "CPU Usage", value: "42%", fill: "bg-indigo-600", val: 42 },
            { label: "Memory Usage", value: "68%", fill: "bg-blue-600", val: 68 },
            { label: "Server Response", value: "98ms", fill: "bg-emerald-600", val: 49 },
            { label: "Error Rate", value: "0.02%", fill: "bg-rose-600", val: 10 }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>{item.label}</span>
                <span className="text-neutral-900">{item.value}</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div className={cn("h-full rounded-full", item.fill)} style={{ width: `${item.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ProjectsPage({
  onOpenProject
}: {
  onOpenProject: (projectId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Projects"
        title="Project Workspace"
        action={
          <Button variant="primary" onClick={() => alert("Create Project Dialog (Mocked)")}>
            <Plus size={16} />
            New Project
          </Button>
        }
      />

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-xl border border-neutral-100/70 shadow-sm">
        <div className="flex items-center gap-2 border border-neutral-100 bg-neutral-50/50 rounded-lg px-3 py-1.5 w-full sm:w-80">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["All", "Healthy", "Reviewing", "Deploying", "Warning"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg border transition",
                filter === item
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-neutral-100 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <Badge tone={statusTone[project.status]}>{project.status}</Badge>
                <span className="text-xs text-neutral-400 font-medium">
                  {project.lastEdited}
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-950">
                {project.name}
              </h3>
              <p className="mt-2 min-h-[52px] text-xs leading-relaxed text-neutral-500 font-medium">
                {project.description}
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-400">AI score</span>
                  <span className="text-neutral-900 font-bold">
                    {project.aiScore}
                  </span>
                </div>
                <ProgressBar
                  value={project.aiScore}
                  tone={project.aiScore > 88 ? "green" : project.aiScore > 80 ? "amber" : "red"}
                />
                <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
                  <span>{project.language}</span>
                  <span>{project.deployments} deploys</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-neutral-50">
              <div className="flex -space-x-1.5">
                {project.members.map((member) => (
                  <span
                    key={member}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[10px] font-bold text-white shadow-sm"
                    title={member}
                  >
                    {initials(member)}
                  </span>
                ))}
              </div>
              <Button onClick={() => onOpenProject(project.id)} className="h-8.5 rounded-lg text-xs font-bold">
                <Code2 size={14} />
                Open IDE
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PullRequestsPage() {
  const prs = [
    { id: "#142", title: "feat: add real-time analytics", repo: "acme/web-app", author: "Rahul Sharma", status: "In Review", codeScore: "94%", reviews: "2 approved, 1 pending", time: "2m ago", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" },
    { id: "#141", title: "fix: resolve login issue", repo: "acme/web-app", author: "Priya Verma", status: "Approved", codeScore: "91%", reviews: "3 approved", time: "15m ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" },
    { id: "#140", title: "refactor: improve data fetching", repo: "acme/api", author: "Aman Khan", status: "Changes Requested", codeScore: "78%", reviews: "1 changes requested", time: "1h ago", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80" },
    { id: "#139", title: "chore: update dependencies", repo: "acme/dashboard", author: "Neha Singh", status: "Merged", codeScore: "88%", reviews: "2 approved", time: "3h ago", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" }
  ];

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Collaboration" title="Pull Requests Overview" />

      {/* PR Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open Reviews", value: "4" },
          { label: "Merged This Week", value: "28" },
          { label: "Unresolved Discussions", value: "7" },
          { label: "Average Review Time", value: "3.5h" }
        ].map((item, idx) => (
          <Card key={idx} className="p-5 bg-white border border-neutral-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{item.label}</span>
            <p className="mt-2.5 text-2xl font-bold text-neutral-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-white border border-neutral-100 shadow-sm rounded-xl">
        <h3 className="font-bold text-neutral-900 text-sm tracking-tight mb-5">Pull Requests</h3>
        <div className="divide-y divide-neutral-100">
          {prs.map((pr) => (
            <div key={pr.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex gap-3.5">
                <img src={pr.avatar} alt="Author" className="h-9 w-9 rounded-full object-cover border border-neutral-100 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{pr.title}</span>
                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                      {pr.repo}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500 font-medium">
                    Opened by {pr.author} • {pr.reviews}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 shrink-0 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-400 block">AI Score</span>
                  <span className={cn("text-xs font-extrabold", Number.parseInt(pr.codeScore) > 85 ? "text-emerald-500" : "text-amber-500")}>
                    {pr.codeScore}
                  </span>
                </div>
                <span className={cn("rounded-lg px-2.5 py-0.5 text-[9.5px] font-bold tracking-tight border",
                  pr.status === "In Review" ? "bg-blue-50 text-blue-600 border-blue-100" :
                  pr.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  pr.status === "Changes Requested" ? "bg-rose-50 text-rose-600 border-rose-100" :
                  "bg-purple-50 text-purple-600 border-purple-100"
                )}>
                  {pr.status}
                </span>
                <span className="text-[10px] font-semibold text-neutral-400">{pr.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DeploymentsPage() {
  const [envFilter, setEnvFilter] = useState("All");

  const deploymentHistory = [
    { id: "dep-102", project: "acme/web-app", env: "Production", version: "v2.3.1", status: "Success", commit: "feat: add real-time analytics (4a3b82f)", time: "2m ago", duration: "1m 15s" },
    { id: "dep-101", project: "acme/api", env: "Staging", version: "v2.3.0-rc2", status: "Success", commit: "fix: resolve login issue (98bb7e2)", time: "15m ago", duration: "48s" },
    { id: "dep-100", project: "acme/worker", env: "Production", version: "v2.2.9", status: "Failed", commit: "refactor: api fetch optimization (68fca20)", time: "1h ago", duration: "2m 5s" },
    { id: "dep-099", project: "acme/dashboard", env: "Staging", version: "v2.2.8", status: "Success", commit: "chore: update dependencies (ff9029a)", time: "3h ago", duration: "54s" },
    { id: "dep-098", project: "acme/web-app", env: "Production", version: "v2.3.0", status: "Success", commit: "release: v2.3.0 master build (a28c312)", time: "1d ago", duration: "1m 10s" }
  ];

  const filteredDeploys = deploymentHistory.filter(dep => envFilter === "All" || dep.env === envFilter);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Deployments" title="Deployment Pipeline" />

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Deploys", value: "148" },
          { label: "Success Rate", value: "97.2%", change: "+0.8% vs last week", color: "text-emerald-500" },
          { label: "Average Build Time", value: "62s" },
          { label: "Active Pipelines", value: "2", status: "Running" }
        ].map((stat, idx) => (
          <Card key={idx} className="p-5 bg-white border border-neutral-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</span>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{stat.value}</span>
              {stat.change && <span className="text-xs font-bold text-emerald-500">{stat.change}</span>}
              {stat.status && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-600 animate-pulse">{stat.status}</span>}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter and Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Logs & environments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white border border-neutral-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Deployment History</h3>
              <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm cursor-pointer hover:bg-neutral-50"
                   onClick={() => setEnvFilter(envFilter === "All" ? "Production" : envFilter === "Production" ? "Staging" : "All")}>
                <span>
                  Env: {envFilter}
                </span>
                <ChevronDown size={12} className="text-neutral-400" />
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {filteredDeploys.map((dep) => (
                <div key={dep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-neutral-900">{dep.project}</span>
                      <span className="text-[10px] font-medium text-neutral-400 bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded">
                        {dep.env}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400">{dep.version}</span>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium">{dep.commit}</p>
                  </div>
                  <div className="flex items-center gap-5 self-end sm:self-auto">
                    <div className="text-right text-[10px] font-medium text-neutral-400">
                      <div>{dep.time}</div>
                      <div>Duration: {dep.duration}</div>
                    </div>
                    <span className={cn(
                      "rounded-lg px-2.5 py-0.5 text-[9.5px] font-bold tracking-tight border",
                      dep.status === "Success"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {dep.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: Active environment details and build status logs */}
        <Card className="p-6 bg-white border border-neutral-100 shadow-sm rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm tracking-tight mb-5">Build logs</h3>
            <div className="bg-neutral-950 text-neutral-200 p-4 rounded-xl font-mono text-[10.5px] leading-relaxed space-y-2.5 overflow-x-auto min-h-[240px]">
              <div className="text-neutral-500">[11:32:01 AM] Starting build pipeline...</div>
              <div className="text-neutral-500">[11:32:05 AM] Fetching repository...</div>
              <div className="text-neutral-300">[11:32:10 AM] Installing dependencies...</div>
              <div className="text-emerald-400">[11:32:32 AM] Compiling pages...</div>
              <div className="text-emerald-400">[11:32:55 AM] Optimizing bundles...</div>
              <div className="text-indigo-400">[11:33:04 AM] Deploying build to CDN...</div>
              <div className="text-emerald-500 font-semibold">[11:33:16 AM] Pipeline success!</div>
            </div>
          </div>
          <button className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-white py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50/50"
                  onClick={() => alert("Downloading raw deployment log files...")}>
            View full console logs
          </button>
        </Card>
      </div>
    </div>
  );
}

export function ReviewsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="AI Reviews"
        title="Review History"
        action={
          <Button variant="primary">
            <Sparkles size={16} />
            Start AI Review
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <p className="text-sm text-neutral-500">Current score</p>
          <p className="mt-3 text-6xl font-semibold text-neutral-950">89</p>
          <ProgressBar value={89} tone="green" />
          <div className="mt-6 grid gap-3">
            {[
              ["Performance issues", "2"],
              ["Security warning", "1"],
              ["Clean code suggestions", "4"]
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-line bg-neutral-50 px-4 py-3"
              >
                <span className="text-sm text-neutral-600">{label}</span>
                <span className="font-semibold text-neutral-950">{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Unresolved Issues" />
          <div className="space-y-3">
            {reviewIssues.map((issue) => (
              <div
                key={issue.title}
                className="rounded-lg border border-line bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-950">
                        {issue.title}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {issue.file}
                      </p>
                    </div>
                  </div>
                  <Badge tone={severityTone[issue.severity]}>
                    {issue.severity}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button>
                    <Sparkles size={16} />
                    Apply Fix
                  </Button>
                  <Button variant="ghost">Open File</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function MonitoringPage() {
  const monitoringStats = [
    ["CPU usage", "40%", Cpu, "violet"],
    ["RAM usage", "70%", Gauge, "amber"],
    ["API latency", `${workspace.latency}ms`, Activity, "blue"],
    ["Uptime", workspace.uptime, CheckCircle2, "green"]
  ] as const;

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Monitoring"
        title="Project Health"
        action={
          <Button>
            <Download size={16} />
            Export Report
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {monitoringStats.map(([label, value, Icon, tone]) => (
          <Card key={label} className="p-5">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
              <Icon size={19} />
            </div>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">
              {value}
            </p>
            <div className="mt-4">
              <ProgressBar
                value={
                  label === "Uptime"
                    ? 99
                    : label === "API latency"
                      ? 62
                      : Number.parseInt(value, 10)
                }
                tone={tone}
              />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <SectionTitle title="CPU, RAM, and Latency" />
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monitoringSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#7c3aed" strokeWidth={2} />
              <Line type="monotone" dataKey="ram" stroke="#f59e0b" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#0284c7"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {["High CPU Usage", "Memory Leak Detected", "Deployment Failed"].map(
          (alert, index) => (
            <Card key={alert} className="p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={18}
                  className={index === 2 ? "text-rose-600" : "text-amber-600"}
                />
                <h3 className="font-semibold text-neutral-950">{alert}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {index === 2
                  ? "Frontend deploy failed on the previous build."
                  : "The monitor crossed its warning threshold."}
              </p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Analytics" title="Team Productivity" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Productivity Graph" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="activity" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="deploys" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="AI Score Trends" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ee" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[70, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#059669"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bugs"
                  stroke="#e11d48"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Deployment Success", "96%"],
          ["Bug Rate", "3.2%"],
          ["Team Activity", "84%"]
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-3 text-4xl font-semibold text-neutral-950">
              {value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TeamPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Team"
        title="Workspace Members"
        action={
          <Button variant="primary">
            <MailPlus size={16} />
            Invite Member
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member) => (
          <Card key={member.email} className="p-5">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white",
                  member.color
                )}
              >
                {initials(member.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-neutral-950">{member.name}</h3>
                <p className="truncate text-sm text-neutral-500">
                  {member.email}
                </p>
              </div>
              <Badge tone={member.role === "Owner" ? "violet" : "neutral"}>
                {member.role}
              </Badge>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
              <span className="flex items-center gap-2 text-neutral-600">
                <CircleDot size={14} className="text-emerald-500" />
                {member.status}
              </span>
              <Button variant="ghost">Manage Role</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Notifications" title="Workspace Alerts" />
      <Card className="divide-y divide-line">
        {notifications.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-neutral-950">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-500">{item.detail}</p>
              </div>
              <Badge tone="blue">New</Badge>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function AlertsPage() {
  const alerts = [
    { id: "alt-1", type: "Critical", label: "High Memory Leak in acme/worker", detail: "Memory consumption reached 92% of budget. Immediate heap snapshot recommended.", time: "10m ago", status: "Active", style: "bg-rose-50 text-rose-600 border-rose-100" },
    { id: "alt-2", type: "Warning", label: "API Latency spike in acme/api", detail: "Response times spiked to 850ms in EU-West regional endpoint for /v1/checkout.", time: "45m ago", status: "Active", style: "bg-amber-50 text-amber-600 border-amber-100" },
    { id: "alt-3", type: "Performance", label: "Unoptimized Database Query", detail: "Query 'SELECT * FROM users WHERE...' is running without index scan on acme/api.", time: "2h ago", status: "Active", style: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { id: "alt-4", type: "Resolved", label: "Deployment Failure acme/dashboard", detail: "Resolved automatically by rollback to master-build (v2.2.7).", time: "3h ago", status: "Resolved", style: "bg-emerald-50 text-emerald-600 border-emerald-100" }
  ];

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Alerts" title="Workspace Health Monitor" />

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "Active Alerts", value: "3", fill: "text-rose-500", desc: "Require attention" },
          { label: "Resolved Today", value: "14", fill: "text-emerald-500", desc: "No actions needed" },
          { label: "Uptime Health Check", value: "99.98%", fill: "text-indigo-500", desc: "Target 99.9%" }
        ].map((item, idx) => (
          <Card key={idx} className="p-5 bg-white border border-neutral-100 shadow-sm rounded-xl">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{item.label}</span>
            <p className={cn("mt-2.5 text-3xl font-bold", item.fill)}>{item.value}</p>
            <p className="text-[11px] text-neutral-400 mt-1 font-medium">{item.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-white border border-neutral-100 shadow-sm rounded-xl">
        <h3 className="font-bold text-neutral-900 text-sm tracking-tight mb-5">System Alerts</h3>
        <div className="divide-y divide-neutral-100">
          {alerts.map((item) => (
            <div key={item.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex gap-3.5">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", item.style)}>
                  <AlertTriangle size={15} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900">{item.label}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 font-medium">{item.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 shrink-0 self-end sm:self-auto">
                <span className="text-[10px] font-semibold text-neutral-400">{item.time}</span>
                <span className={cn("rounded-lg px-2.5 py-0.5 text-[9.5px] font-bold tracking-tight border",
                  item.status === "Active" ? "bg-rose-50 text-rose-600 border-rose-100/50" : "bg-neutral-50 text-neutral-500 border-neutral-100"
                )}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function IntegrationsPage() {
  const integrations = [
    { name: "Firebase", desc: "Real-time databases, analytics, and messaging sync.", status: "Connected", code: "fb", tone: "bg-amber-50 border-amber-100 text-amber-600" },
    { name: "Groq", desc: "Supercharged AI insights and telemetry models.", status: "Connected", code: "gq", tone: "bg-indigo-50 border-indigo-100 text-indigo-600" },
    { name: "MongoDB", desc: "Live database connection, metric collection, and indices.", status: "Disconnected", code: "mg", tone: "bg-neutral-50 border-neutral-100 text-neutral-500" },
    { name: "Slack", desc: "Deploy alerts and pipeline events notifications channel.", status: "Connected", code: "sl", tone: "bg-purple-50 border-purple-100 text-purple-600" },
    { name: "Discord", desc: "Webhook channels integration for live community stats.", status: "Disconnected", code: "dc", tone: "bg-blue-50 border-blue-100 text-blue-600" }
  ];

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Collaboration" title="Third-Party Integrations" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((item) => (
          <Card key={item.name} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border font-bold text-xs", item.tone)}>
                  {item.code.toUpperCase()}
                </span>
                <span className={cn("rounded-lg px-2 py-0.5 text-[9.5px] font-bold tracking-tight border",
                  item.status === "Connected" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-neutral-50 text-neutral-400 border-neutral-200"
                )}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-sm text-neutral-900">{item.name}</h3>
              <p className="mt-2 text-xs text-neutral-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
            <button className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-100 bg-white py-2 text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-50"
                    onClick={() => alert(`${item.status === "Connected" ? "Configuring" : "Connecting"} integration for ${item.name}...`)}>
              {item.status === "Connected" ? "Configure" : "Connect"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Settings" title="Workspace Configuration" />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-100 pb-px">
        {["Profile", "Account", "Workspace", "Theme", "Notifications"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition",
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {activeTab === "Profile" && (
          <Card className="p-6">
            <h3 className="font-bold text-neutral-950 text-sm">Personal Profile</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Update your profile display details.</p>
            <div className="mt-5 grid gap-4.5">
              {[
                { label: "Display Name", val: "Harsh Sharma" },
                { label: "Work Email", val: "harsh@codedwaves.dev" },
                { label: "Bio / Tagline", val: "Senior Frontend Engineer & Designer" }
              ].map((item) => (
                <label key={item.label} className="grid gap-2 text-xs font-bold text-neutral-500">
                  {item.label}
                  <input
                    className="h-10.5 rounded-xl border border-neutral-100 bg-neutral-50/50 px-3.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium text-neutral-800"
                    defaultValue={item.val}
                  />
                </label>
              ))}
            </div>
            <button className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 shadow-indigo-600/10"
                    onClick={() => alert("Profile details saved successfully!")}>
              Save Changes
            </button>
          </Card>
        )}

        {activeTab === "Account" && (
          <Card className="p-6">
            <h3 className="font-bold text-neutral-950 text-sm">Account Settings</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Manage security, credentials, and tokens.</p>
            <div className="mt-5 grid gap-4.5">
              {[
                { label: "Current Password", type: "password", val: "••••••••" },
                { label: "New Password", type: "password", val: "" },
                { label: "API Token Key", type: "text", val: "dw_live_9a82b3d82f7c00e" }
              ].map((item) => (
                <label key={item.label} className="grid gap-2 text-xs font-bold text-neutral-500">
                  {item.label}
                  <input
                    type={item.type}
                    className="h-10.5 rounded-xl border border-neutral-100 bg-neutral-50/50 px-3.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium text-neutral-800"
                    defaultValue={item.val}
                  />
                </label>
              ))}
            </div>
            <button className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 shadow-indigo-600/10"
                    onClick={() => alert("Account security updated successfully!")}>
              Update Security
            </button>
          </Card>
        )}

        {activeTab === "Workspace" && (
          <Card className="p-6">
            <h3 className="font-bold text-neutral-950 text-sm">Workspace Controls</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">General configuration for the entire team.</p>
            <div className="mt-5 space-y-3.5">
              {[
                "Email verification required",
                "AI review before deploy",
                "Export ZIP enabled"
              ].map((setting) => (
                <label
                  key={setting}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3.5 text-xs font-semibold text-neutral-600"
                >
                  {setting}
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
                </label>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "Theme" && (
          <Card className="p-6">
            <h3 className="font-bold text-neutral-950 text-sm">Theme Settings</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Personalize your environment's color schemes.</p>
            <div className="mt-5 grid grid-cols-3 gap-3.5">
              {["Light Mode", "Dark Mode (Beta)", "System Default"].map((theme) => (
                <div
                  key={theme}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition",
                    theme === "Light Mode"
                      ? "border-indigo-600 bg-indigo-50/20 text-indigo-600 font-bold"
                      : "border-neutral-100 bg-neutral-50/50 text-neutral-500 hover:bg-neutral-50"
                  )}
                  onClick={() => alert(`Theme changed to: ${theme}`)}
                >
                  <span className="text-xs">{theme}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "Notifications" && (
          <Card className="p-6">
            <h3 className="font-bold text-neutral-950 text-sm">Notification Settings</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Decide how and when we send notifications.</p>
            <div className="mt-5 space-y-3.5">
              {[
                "Email digests (Weekly)",
                "Real-time slack alerts",
                "Deployment success notifications",
                "New AI suggestions reports"
              ].map((setting) => (
                <label
                  key={setting}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3.5 text-xs font-semibold text-neutral-600"
                >
                  {setting}
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
                </label>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export function RightTeamPanel() {
  const activity = [
    {
      name: "Rahul pushed a commit",
      meta: "acme/api",
      time: "2m ago",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Priya created a pull request",
      meta: "acme/web-app",
      time: "10m ago",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Aman deployed to production",
      meta: "acme/worker",
      time: "1h ago",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Neha requested review on PR #142",
      meta: "acme/dashboard",
      time: "2h ago",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80"
    }
  ];

  const onlineMembers = [
    {
      name: "Rahul Sharma",
      status: "Working on API issue",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Priya Verma",
      status: "Reviewing PR #142",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Aman Khan",
      status: "Deployed v2.3.1",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      name: "Neha Singh",
      status: "In a meeting",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80"
    }
  ];

  const chatMessages = [
    {
      sender: "Rahul Sharma",
      time: "10:30 AM",
      message: "API issue has been fixed ✅",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      sender: "Priya Verma",
      time: "10:31 AM",
      message: "Great! Can you review the dashboard PR when you get a chance?",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    {
      sender: "Harsh Patel",
      time: "10:32 AM",
      message: "Sure, deploying the latest build now. Will update here once it's live.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
    }
  ];

  return (
    <aside className="hidden border-l border-neutral-100 bg-white p-5 xl:flex flex-col gap-7 w-[340px] shrink-0 overflow-y-auto h-full">
      {/* Team Activity Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Team Activity</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="space-y-4">
          {activity.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <img src={item.avatar} alt="Author" className="h-7 w-7 rounded-full object-cover border border-neutral-100 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-900 leading-normal">{item.name}</p>
                <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{item.meta}</p>
              </div>
              <span className="text-[9.5px] font-bold text-neutral-400 shrink-0 mt-0.5">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Online Members Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Online Members</h3>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">View all</button>
        </div>
        <div className="space-y-3.5">
          {onlineMembers.map((member, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img src={member.avatar} alt="Member" className="h-7 w-7 rounded-full object-cover border border-neutral-100" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 truncate">{member.name}</p>
                <p className="text-[10px] font-medium text-neutral-400 truncate mt-0.5">{member.status}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-white py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50/50">
          <Plus size={13} />
          Invite Members
        </button>
      </div>

      {/* Team Chat Section */}
      <div className="flex flex-col flex-1 min-h-[300px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 text-sm tracking-tight">Team Chat</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 cursor-pointer hover:text-neutral-600">
            <span># general</span>
            <ChevronDown size={11} />
          </div>
        </div>
        
        {/* Chat Feed */}
        <div className="space-y-3.5 flex-1 overflow-y-auto mb-4 pr-1 max-h-[220px]">
          {chatMessages.map((msg, idx) => {
            return (
              <div key={idx} className="flex gap-2.5 items-start">
                <img src={msg.avatar} alt="Sender" className="h-7 w-7 rounded-full object-cover shrink-0 border border-neutral-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-bold text-neutral-800">{msg.sender}</span>
                    <span className="text-[9px] font-medium text-neutral-400">{msg.time}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-neutral-600 mt-0.5">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Message Input */}
        <div className="relative mt-auto">
          <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <button className="text-neutral-400 hover:text-neutral-600 transition" title="Attach file">
                <Paperclip size={14} />
              </button>
              <button className="text-neutral-400 hover:text-neutral-600 transition" title="Insert emoji">
                <Smile size={14} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Message #general..."
              className="w-full bg-transparent text-[11px] outline-none placeholder:text-neutral-400 mx-2.5 font-medium"
            />
            <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/10">
              <Send size={11} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
