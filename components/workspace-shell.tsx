"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Settings,
  User,
  WalletCards,
  LayoutDashboard,
  Braces,
  GitPullRequest,
  Bot,
  Rocket,
  Cpu,
  AlertTriangle,
  LineChart,
  Users,
  Puzzle,
  ChevronsUpDown,
  Sparkles
} from "lucide-react";
import {
  AnalyticsPage,
  DashboardOverview,
  MonitoringPage,
  NotificationsPage,
  ProjectsPage,
  ReviewsPage,
  SettingsPage,
  TeamPage,
  RightTeamPanel,
  PullRequestsPage,
  DeploymentsPage,
  AlertsPage,
  IntegrationsPage
} from "@/components/dashboard-pages";
import { Button } from "@/components/ui";
import type { AppView } from "@/lib/mock-data";
import { workspace } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { UserSession } from "./devwatch-app";

export function WorkspaceShell({
  view,
  onViewChange,
  onOpenProject,
  onHome,
  user,
  onSignOut
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onOpenProject: (projectId: string) => void;
  onHome: () => void;
  user: UserSession | null;
  onSignOut: () => void;
}) {
  const sidebarGroups = [
    {
      title: "Workspace",
      items: [
        { label: "Overview", icon: LayoutDashboard, view: "overview" as AppView },
        { label: "Projects", icon: Braces, view: "projects" as AppView },
        { label: "Pull Requests", icon: GitPullRequest, view: "pull-requests" as AppView, badge: "12", badgeColor: "bg-indigo-50 text-indigo-600" },
        { label: "AI Code Review", icon: Bot, view: "reviews" as AppView },
        { label: "Deployments", icon: Rocket, view: "deployments" as AppView }
      ]
    },
    {
      title: "Insights",
      items: [
        { label: "Monitoring", icon: Cpu, view: "monitoring" as AppView },
        { label: "Alerts", icon: AlertTriangle, view: "alerts" as AppView, badge: "3", badgeColor: "bg-rose-50 text-rose-600" },
        { label: "Analytics", icon: LineChart, view: "analytics" as AppView }
      ]
    },
    {
      title: "Collaboration",
      items: [
        { label: "Team", icon: Users, view: "team" as AppView },
        { label: "Integrations", icon: Puzzle, view: "integrations" as AppView }
      ]
    },
    {
      title: "System",
      items: [
        { label: "Settings", icon: Settings, view: "settings" as AppView }
      ]
    }
  ];

  const allItems = sidebarGroups.flatMap((g) => g.items);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#F8F9FC] text-neutral-900 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden w-[270px] shrink-0 border-r border-neutral-100 bg-white p-5 lg:flex flex-col justify-between h-full overflow-hidden transition-all duration-300">
        <div className="flex flex-col gap-7 h-full overflow-hidden">
          {/* Logo Brand */}
          <button
            onClick={onHome}
            className="flex items-center gap-3 rounded-md p-1.5 text-left transition hover:opacity-90 focus:outline-none shrink-0"
          >
            <div className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/10">
              <svg className="h-5.5 w-5.5 text-white" viewBox="0 0 40 40" fill="none">
                <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
                <path d="M16 15L11 20L16 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 15L29 20L24 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>
              <span className="text-lg font-bold tracking-tight text-neutral-900">
                DevWatch <span className="text-indigo-600 font-semibold">AI</span>
              </span>
            </span>
          </button>

          {/* Navigation Groups */}
          <div className="space-y-5 overflow-y-auto flex-1 pr-1">
            {sidebarGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {group.title}
                </span>
                <nav className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.view;

                    return (
                      <button
                        key={item.label}
                        onClick={() => onViewChange(item.view)}
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-xl px-3.5 text-[13px] font-medium transition duration-200",
                          active
                            ? "bg-indigo-50/80 text-indigo-600 font-semibold shadow-sm shadow-indigo-100/30"
                            : "text-neutral-500 hover:bg-neutral-50/80 hover:text-neutral-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={active ? "text-indigo-600" : "text-neutral-400"} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none", item.badgeColor)}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Card and Profile Section */}
        <div className="flex flex-col gap-4 mt-auto pt-4">
          {/* Upgrade to Pro Card */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-50/80 border border-neutral-100 p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-3">
              <Sparkles size={15} />
            </div>
            <h4 className="font-bold text-neutral-900 text-xs tracking-tight">Upgrade to Pro</h4>
            <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed font-medium">
              Unlock advanced analytics, longer history, and more AI features.
            </p>
            <button className="mt-3.5 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 shadow-indigo-600/10 hover:shadow-lg">
              Upgrade Now
            </button>
          </div>

          {/* User Profile Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-neutral-100 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{(user?.name || "H").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-neutral-950 truncate max-w-[120px]">
                  {user?.name || "Guest User"}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium tracking-tight truncate max-w-[120px]">
                  {user?.email || "guest@devwatch.ai"}
                </span>
              </div>
            </div>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded p-1 hover:bg-neutral-50">
                <ChevronsUpDown size={14} className="text-neutral-400 hover:text-neutral-600" />
              </summary>
              <div className="absolute bottom-8 right-0 z-30 w-48 overflow-hidden rounded-lg border border-neutral-100 bg-white p-1.5 shadow-md">
                {[
                  { label: "Profile", icon: User, view: "settings" as AppView },
                  { label: "Settings", icon: Settings, view: "settings" as AppView },
                  { label: "Logout", icon: LogOut, view: "landing" as AppView }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      onClick={() =>
                        item.label === "Logout" ? onSignOut() : onViewChange(item.view)
                      }
                    >
                      <Icon size={13} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <section className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* Header bar */}
        <header className="border-b border-neutral-100 bg-white/95 px-6 py-4 backdrop-blur xl:px-8 shrink-0">
          <div className="flex items-center justify-between gap-6">
            {/* Search Input Box */}
            <div className="flex max-w-md flex-1 items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-2.5">
              <div className="flex flex-1 items-center gap-2.5">
                <Search size={15} className="text-neutral-400" />
                <input
                  className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400 font-medium"
                  placeholder="Search projects, PRs, deployments..."
                />
              </div>
              <span className="hidden sm:inline-flex items-center gap-0.5 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 shadow-sm font-mono leading-none">
                ⌘ K
              </span>
            </div>

            {/* Notification and New Action button */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-100 bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-800 shadow-sm"
                onClick={() => onViewChange("alerts")}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none border-2 border-white">
                  2
                </span>
              </button>

              {/* + New Button dropdown */}
              <details className="group relative">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl bg-indigo-600 px-4.5 text-xs font-semibold text-white transition hover:bg-indigo-700 shadow-sm shadow-indigo-600/10 focus:outline-none">
                  <Plus size={14} />
                  New
                  <ChevronDown
                    size={13}
                    className="transition group-open:rotate-180 ml-0.5"
                  />
                </summary>
                <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg">
                  {[
                    "New Workspace",
                    "New Project",
                    "New File",
                    "New Folder",
                    "New Team Room",
                    "Invite Member",
                    "Start AI Review"
                  ].map((item) => (
                    <button
                      key={item}
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      onClick={() =>
                        item.includes("Project")
                          ? onViewChange("projects")
                          : item.includes("Team") || item.includes("Invite")
                          ? onViewChange("team")
                          : item.includes("Review")
                          ? onViewChange("reviews")
                          : null
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Navigation for Mobile Screens */}
          <nav className="mt-3 flex gap-1.5 overflow-x-auto lg:hidden py-1">
            {allItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.view;

              return (
                <button
                  key={item.label}
                  onClick={() => onViewChange(item.view)}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold shadow-sm transition",
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-neutral-100 bg-white text-neutral-600"
                  )}
                >
                  <Icon size={13} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Dashboard Pages Display Grid */}
        <div className="grid flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] min-h-0 overflow-hidden">
          <section className="min-w-0 p-6 xl:p-8 bg-[#F8F9FC] overflow-y-auto h-full">
            {view === "overview" && <DashboardOverview onOpenProject={onOpenProject} />}
            {view === "projects" && <ProjectsPage onOpenProject={onOpenProject} />}
            {view === "pull-requests" && <PullRequestsPage />}
            {view === "reviews" && <ReviewsPage />}
            {view === "deployments" && <DeploymentsPage />}
            {view === "monitoring" && <MonitoringPage />}
            {view === "alerts" && <AlertsPage />}
            {view === "analytics" && <AnalyticsPage />}
            {view === "team" && <TeamPage />}
            {view === "integrations" && <IntegrationsPage />}
            {view === "settings" && <SettingsPage />}
            {view === "notifications" && <NotificationsPage />}
          </section>
          <RightTeamPanel />
        </div>
      </section>
    </main>
  );
}
