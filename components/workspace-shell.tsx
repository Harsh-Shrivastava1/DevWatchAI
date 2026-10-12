"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode2,
  FolderGit2,
  HardDrive,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge, Button, Card, IconButton, ProgressBar } from "@/components/ui";
import { apiData } from "@/lib/api";
import type {
  Activity,
  AIReview,
  AppView,
  DashboardData,
  Deployment,
  Member,
  MonitoringRecord,
  NotificationRecord,
  Project,
  UserSession,
  Workspace
} from "@/lib/types";
import { cn, initials } from "@/lib/utils";

type DashboardView = Exclude<AppView, "landing">;

const emptyDashboard: DashboardData = {
  counts: {},
  projects: [],
  reviews: [],
  deployments: [],
  monitoring: [],
  notifications: [],
  activity: [],
  members: []
};

interface NavItem {
  label: string;
  view: DashboardView;
  icon: LucideIcon;
  description: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "DEVELOPMENT",
    items: [
      {
        label: "Overview",
        view: "overview",
        icon: LayoutDashboard,
        description: "Workspace activity and status"
      },
      {
        label: "Projects",
        view: "projects",
        icon: Braces,
        description: "Repositories and Cloud IDE"
      },
      {
        label: "IDE",
        view: "ide",
        icon: Code2,
        description: "Cloud code editor"
      },
      {
        label: "AI Code Review",
        view: "reviews",
        icon: Bot,
        description: "Security and quality findings"
      },
      {
        label: "Deployments",
        view: "deployments",
        icon: Rocket,
        description: "Build history and releases"
      }
    ]
  },
  {
    title: "OBSERVABILITY",
    items: [
      {
        label: "Monitoring",
        view: "monitoring",
        icon: Cpu,
        description: "Telemetry and system health"
      },
      {
        label: "Alerts",
        view: "alerts",
        icon: AlertTriangle,
        description: "Notifications and issues"
      },
      {
        label: "Analytics",
        view: "analytics",
        icon: BarChart3,
        description: "Quality benchmarks and trends"
      }
    ]
  },
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Members",
        view: "team",
        icon: Users,
        description: "Team access and roles"
      },
      {
        label: "Settings",
        view: "settings",
        icon: Settings,
        description: "Preferences and configuration"
      }
    ]
  }
];

export function WorkspaceShell({
  view,
  onViewChange,
  onOpenProject,
  onHome,
  user,
  onSignOut,
  currentProjectId
}: {
  view: DashboardView | AppView;
  onViewChange: (view: AppView) => void;
  onOpenProject: (projectId: string, projectName?: string) => void;
  onHome: () => void;
  user: UserSession;
  onSignOut: () => void;
  currentProjectId?: string | null;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentProjectId || null
  );

  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  const handleOpenProject = (id: string, name?: string) => {
    setSelectedProjectId(id);
    onOpenProject(id, name);
  };

  const handleNavClick = (targetView: AppView) => {
    if (targetView === "ide") {
      const activeProj = (selectedProjectId || currentProjectId)
        ? projects.find((p) => p.id === (selectedProjectId || currentProjectId))
        : (projects.length === 1 ? projects[0] : null);

      if (activeProj) {
        handleOpenProject(activeProj.id, activeProj.projectName);
      } else {
        // Project selection is required: use existing project-selection flow
        onViewChange("projects");
      }
      return;
    }
    onViewChange(targetView);
  };
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{
    projects: Project[];
    files: Array<{ id: string; projectId: string; path: string; name: string }>;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
  const allNavItems = navSections.flatMap((s) => s.items);
  const currentNav = allNavItems.find((item) => item.view === view) || allNavItems[0];
  const unreadCount = dashboard.notifications.filter((item) => !item.read).length;

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [project.projectName, project.description, project.status]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(query));
  });

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      void loadWorkspaceData(workspaceId);
    } else {
      setDashboard(emptyDashboard);
      setProjects([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setCreateMenuOpen(false);
      }
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkspaceDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (!workspaceId || query.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults(
          await apiData(
            `/api/search?workspaceId=${workspaceId}&q=${encodeURIComponent(query)}`,
            { token: user.token }
          )
        );
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [search, user.token, workspaceId]);

  async function loadWorkspaces() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiData<Workspace[]>("/api/workspaces", {
        token: user.token
      });
      setWorkspaces(data);
      setWorkspaceId((current) => current || data[0]?.id || "");
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceData(id: string) {
    setRefreshing(true);
    setError(null);
    try {
      const [dashboardData, projectData] = await Promise.all([
        apiData<DashboardData>(`/api/dashboard?workspaceId=${id}`, {
          token: user.token
        }),
        apiData<Project[]>(`/api/projects?workspaceId=${id}`, {
          token: user.token
        })
      ]);
      setDashboard({
        ...emptyDashboard,
        ...dashboardData,
        counts: dashboardData.counts || {}
      });
      setProjects(projectData);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setRefreshing(false);
    }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceName.trim()) return;
    setRefreshing(true);
    setError(null);
    try {
      const workspace = await apiData<Workspace>("/api/workspaces", {
        method: "POST",
        token: user.token,
        body: { workspaceName: workspaceName.trim() }
      });
      setWorkspaces((current) => [workspace, ...current]);
      setWorkspaceId(workspace.id);
      setWorkspaceName("");
      setWorkspaceDropdownOpen(false);
      onViewChange("overview");
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setRefreshing(false);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !projectName.trim()) return;
    setRefreshing(true);
    setError(null);
    try {
      const project = await apiData<Project>("/api/projects", {
        method: "POST",
        token: user.token,
        body: {
          workspaceId,
          projectName: projectName.trim(),
          description: projectDescription.trim()
        }
      });
      setProjects((current) => [project, ...current]);
      setDashboard((current) => ({
        ...current,
        counts: {
          ...current.counts,
          projects: (current.counts.projects || 0) + 1
        },
        projects: [project, ...current.projects]
      }));
      setProjectName("");
      setProjectDescription("");
      onOpenProject(project.id, project.projectName);
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setRefreshing(false);
    }
  }

  async function deleteProject(project: Project) {
    if (
      !window.confirm(
        `Delete "${project.projectName}" and all of its files? This cannot be undone.`
      )
    ) {
      return;
    }
    setRefreshing(true);
    setError(null);
    try {
      await apiData(`/api/projects/${project.id}`, {
        method: "DELETE",
        token: user.token
      });
      setProjects((current) => current.filter((item) => item.id !== project.id));
      await loadWorkspaceData(workspaceId);
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fb] text-neutral-950">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
        {/* Brand Area */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
          <button
            className="flex items-center gap-2.5 rounded-md text-left transition hover:opacity-90"
            onClick={onHome}
            type="button"
          >
            <svg
              className="h-7 w-7 shrink-0"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="logo-outline-shell-refined"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <g transform="rotate(45 50 50)">
                <rect
                  x="26"
                  y="26"
                  width="48"
                  height="48"
                  rx="12"
                  stroke="url(#logo-outline-shell-refined)"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
              <path
                d="M 39 42 L 31 50 L 39 58"
                stroke="url(#logo-outline-shell-refined)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 47 36 L 53 64"
                stroke="url(#logo-outline-shell-refined)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 61 42 L 69 50 L 61 58"
                stroke="url(#logo-outline-shell-refined)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <span className="text-sm font-bold tracking-tight text-neutral-950">
                DevWatch <span className="text-indigo-700">AI</span>
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                Developer Platform
              </span>
            </div>
          </button>
        </div>

        {/* Workspace Switcher in Sidebar */}
        <div className="relative border-b border-neutral-200 p-3" ref={workspaceDropdownRef}>
          <button
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-left transition hover:border-neutral-300 hover:bg-neutral-100"
            onClick={() => setWorkspaceDropdownOpen((prev) => !prev)}
            type="button"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-700 text-[10px] font-bold text-white">
                {selectedWorkspace?.workspaceName?.charAt(0).toUpperCase() || "W"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-900">
                  {selectedWorkspace?.workspaceName || "Select Workspace"}
                </p>
              </div>
            </div>
            <ChevronsUpDown size={13} className="shrink-0 text-neutral-400" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute left-3 right-3 top-[52px] z-40 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
              <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                Workspaces
              </p>
              <div className="max-h-48 overflow-y-auto">
                {workspaces.map((w) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition",
                      w.id === workspaceId
                        ? "bg-indigo-50 font-semibold text-indigo-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                    key={w.id}
                    onClick={() => {
                      setWorkspaceId(w.id);
                      setWorkspaceDropdownOpen(false);
                    }}
                    type="button"
                  >
                    <span className="truncate">{w.workspaceName}</span>
                    {w.id === workspaceId && <Check size={13} className="text-indigo-700" />}
                  </button>
                ))}
              </div>
              <div className="mt-1 border-t border-neutral-100 pt-1">
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  onClick={() => {
                    setWorkspaceDropdownOpen(false);
                    onViewChange("settings");
                  }}
                  type="button"
                >
                  <Plus size={13} />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-2.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = view === item.view;
                  let badgeValue: number | undefined;
                  if (item.view === "alerts" && unreadCount > 0) {
                    badgeValue = unreadCount;
                  } else if (item.view === "projects" && projects.length > 0) {
                    badgeValue = projects.length;
                  }

                  return (
                    <button
                      className={cn(
                        "group flex h-8 w-full items-center justify-between rounded-md px-2.5 text-xs font-medium transition",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                      )}
                      key={item.view}
                      onClick={() => handleNavClick(item.view)}
                      type="button"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          size={15}
                          className={cn(
                            "transition",
                            isActive
                              ? "text-indigo-700"
                              : "text-neutral-400 group-hover:text-neutral-700"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {badgeValue !== undefined && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                            item.view === "alerts"
                              ? "bg-rose-600 text-white"
                              : isActive
                                ? "bg-indigo-200/60 text-indigo-800"
                                : "bg-neutral-100 text-neutral-600"
                          )}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={user.name} photoURL={user.photoURL} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-900">{user.name}</p>
                <p className="truncate text-[10px] text-neutral-500">{user.email}</p>
              </div>
            </div>
            <button
              aria-label="Sign out"
              className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-950"
              onClick={onSignOut}
              title="Sign out"
              type="button"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Application Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle Navigation"
              className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 lg:hidden"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              type="button"
            >
              <Menu size={18} />
            </button>

            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <span className="text-xs font-medium text-neutral-400">
                {selectedWorkspace?.workspaceName || "Workspace"}
              </span>
              <ChevronRight size={13} className="text-neutral-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-950">
                  {currentNav.label}
                </span>
                {refreshing && (
                  <RefreshCw size={11} className="animate-spin text-indigo-700" />
                )}
              </div>
            </div>
          </div>

          {/* Center: Global Search */}
          <div className="relative mx-3 w-full max-w-sm" ref={searchContainerRef}>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
              <Search size={14} className="shrink-0 text-neutral-400" />
              <input
                className="w-full bg-transparent text-xs text-neutral-900 outline-none placeholder:text-neutral-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects, files, code..."
                value={search}
              />
              {search ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setSearchResults(null);
                  }}
                  type="button"
                >
                  <X size={12} className="text-neutral-400 hover:text-neutral-700" />
                </button>
              ) : (
                <span className="hidden rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline">
                  ⌘K
                </span>
              )}
            </div>

            {search.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-9 z-40 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-neutral-500">Searching workspace...</p>
                ) : searchResults &&
                  (searchResults.projects.length > 0 || searchResults.files.length > 0) ? (
                  <div className="space-y-1.5">
                    {searchResults.projects.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                          Projects
                        </p>
                        {searchResults.projects.map((proj) => (
                          <button
                            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-neutral-50"
                            key={`project-${proj.id}`}
                            onClick={() => {
                              handleOpenProject(proj.id, proj.projectName);
                              setSearchResults(null);
                              setSearch("");
                            }}
                            type="button"
                          >
                            <span className="flex items-center gap-2">
                              <Braces size={13} className="text-indigo-700" />
                              <span className="font-semibold text-neutral-900">
                                {proj.projectName}
                              </span>
                            </span>
                            <span className="text-[10px] text-neutral-400">Open IDE</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.files.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                          Files
                        </p>
                        {searchResults.files.map((file) => (
                          <button
                            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-neutral-50"
                            key={`file-${file.id}`}
                            onClick={() => {
                              const proj = projects.find((p) => p.id === file.projectId);
                              handleOpenProject(file.projectId, proj?.projectName);
                              setSearchResults(null);
                              setSearch("");
                            }}
                            type="button"
                          >
                            <span className="flex items-center gap-2">
                              <FileCode2 size={13} className="text-neutral-500" />
                              <span className="font-mono text-neutral-800">{file.path}</span>
                            </span>
                            <span className="text-[10px] text-neutral-400">Open file</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-xs text-neutral-500">
                    No results matching &ldquo;{search}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <IconButton
              label="Alerts and Notifications"
              onClick={() => onViewChange("alerts")}
              size="sm"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </IconButton>

            <div className="relative" ref={createMenuRef}>
              <Button
                onClick={() => setCreateMenuOpen((prev) => !prev)}
                size="sm"
                variant="primary"
              >
                <Plus size={14} />
                <span>New</span>
                <ChevronDown size={12} className="text-indigo-200" />
              </Button>

              {createMenuOpen && (
                <div className="absolute right-0 top-10 z-40 w-44 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onViewChange("projects");
                    }}
                    type="button"
                  >
                    <Braces size={13} className="text-indigo-700" />
                    <span>New Project</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onViewChange("reviews");
                    }}
                    type="button"
                  >
                    <Bot size={13} className="text-indigo-700" />
                    <span>Start AI Review</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onViewChange("team");
                    }}
                    type="button"
                  >
                    <UserPlus size={13} className="text-indigo-700" />
                    <span>Invite Member</span>
                  </button>
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onViewChange("settings");
                    }}
                    type="button"
                  >
                    <Settings size={13} className="text-neutral-400" />
                    <span>New Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        {mobileNavOpen && (
          <div className="border-b border-neutral-200 bg-white p-2.5 lg:hidden">
            <div className="flex flex-wrap gap-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.view;
                return (
                  <button
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition",
                      isActive
                        ? "border-indigo-700 bg-indigo-700 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    )}
                    key={item.view}
                    onClick={() => {
                      handleNavClick(item.view);
                      setMobileNavOpen(false);
                    }}
                    type="button"
                  >
                    <Icon size={13} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== VIEW CONTENT CONTAINER ===================== */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {error && <ErrorBanner message={error} />}

            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                <RefreshCw size={24} className="animate-spin text-indigo-700" />
                <h3 className="mt-3 text-sm font-bold text-neutral-950">
                  Loading Workspace
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Retrieving your projects, reviews, and MongoDB Atlas data...
                </p>
              </div>
            ) : !selectedWorkspace ? (
              <NoWorkspaceForm
                creating={refreshing}
                onSubmit={createWorkspace}
                setWorkspaceName={setWorkspaceName}
                workspaceName={workspaceName}
              />
            ) : (
              <DashboardViewContent
                createProject={createProject}
                createWorkspace={createWorkspace}
                dashboard={dashboard}
                projectDescription={projectDescription}
                projectName={projectName}
                projects={filteredProjects}
                refreshing={refreshing}
                selectedWorkspace={selectedWorkspace}
                setProjectDescription={setProjectDescription}
                setProjectName={setProjectName}
                setWorkspaceName={setWorkspaceName}
                user={user}
                view={view}
                workspaceName={workspaceName}
                onDeleteProject={deleteProject}
                onOpenProject={handleOpenProject}
                onViewChange={onViewChange}
                onWorkspaceChanged={() => loadWorkspaceData(workspaceId)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* VIEW ROUTER                                                               */
/* ========================================================================= */

function DashboardViewContent({
  createProject,
  createWorkspace,
  dashboard,
  projectDescription,
  projectName,
  projects,
  refreshing,
  selectedWorkspace,
  setProjectDescription,
  setProjectName,
  setWorkspaceName,
  user,
  view,
  workspaceName,
  onDeleteProject,
  onOpenProject,
  onViewChange,
  onWorkspaceChanged
}: {
  createProject: (event: FormEvent<HTMLFormElement>) => void;
  createWorkspace: (event: FormEvent<HTMLFormElement>) => void;
  dashboard: DashboardData;
  projectDescription: string;
  projectName: string;
  projects: Project[];
  refreshing: boolean;
  selectedWorkspace: Workspace;
  setProjectDescription: (value: string) => void;
  setProjectName: (value: string) => void;
  setWorkspaceName: (value: string) => void;
  user: UserSession;
  view: DashboardView | AppView;
  workspaceName: string;
  onDeleteProject: (project: Project) => void;
  onOpenProject: (projectId: string, projectName?: string) => void;
  onViewChange: (view: AppView) => void;
  onWorkspaceChanged: () => void;
}) {
  switch (view) {
    case "overview":
      return (
        <OverviewPage
          dashboard={dashboard}
          projects={projects}
          selectedWorkspace={selectedWorkspace}
          onOpenProject={onOpenProject}
          onViewChange={onViewChange}
        />
      );
    case "projects":
      return (
        <ProjectsPage
          createProject={createProject}
          projectDescription={projectDescription}
          projectName={projectName}
          projects={projects}
          refreshing={refreshing}
          selectedWorkspace={selectedWorkspace}
          setProjectDescription={setProjectDescription}
          setProjectName={setProjectName}
          onDeleteProject={onDeleteProject}
          onOpenProject={onOpenProject}
        />
      );
    case "reviews":
      return (
        <ReviewsPage
          onOpenProject={onOpenProject}
          projects={projects}
          reviews={dashboard.reviews}
        />
      );
    case "deployments":
      return (
        <DeploymentsPage
          deployments={dashboard.deployments}
          onOpenProject={onOpenProject}
          projects={projects}
        />
      );
    case "monitoring":
      return <MonitoringPage records={dashboard.monitoring} />;
    case "alerts":
      return <AlertsPage notifications={dashboard.notifications} />;
    case "analytics":
      return <AnalyticsPage projects={projects} reviews={dashboard.reviews} />;
    case "team":
      return (
        <TeamPage
          members={dashboard.members}
          token={user.token}
          user={user}
          workspaceId={selectedWorkspace.id}
          onChanged={onWorkspaceChanged}
        />
      );
    case "integrations":
      return <IntegrationsPage />;
    case "ide":
      return (
        <ProjectsPage
          createProject={createProject}
          projectDescription={projectDescription}
          projectName={projectName}
          projects={projects}
          refreshing={refreshing}
          selectedWorkspace={selectedWorkspace}
          setProjectDescription={setProjectDescription}
          setProjectName={setProjectName}
          onDeleteProject={onDeleteProject}
          onOpenProject={onOpenProject}
        />
      );
    case "settings":
      return (
        <SettingsPage
          createWorkspace={createWorkspace}
          refreshing={refreshing}
          selectedWorkspace={selectedWorkspace}
          setWorkspaceName={setWorkspaceName}
          workspaceName={workspaceName}
        />
      );
    default:
      return null;
  }
}

/* ========================================================================= */
/* C. OVERVIEW PAGE                                                          */
/* ========================================================================= */

function OverviewPage({
  dashboard,
  projects,
  selectedWorkspace,
  onOpenProject,
  onViewChange
}: {
  dashboard: DashboardData;
  projects: Project[];
  selectedWorkspace: Workspace;
  onOpenProject: (projectId: string, projectName?: string) => void;
  onViewChange: (view: AppView) => void;
}) {
  const latestDeployments = dashboard.deployments.slice(0, 3);
  const latestReviews = dashboard.reviews.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              <Server size={12} />
              Active Workspace
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={12} />
              MongoDB Connected
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            {selectedWorkspace.workspaceName}
          </h1>
          <p className="text-xs text-neutral-500">
            Engineering workspace with Cloud IDE, automated Groq AI code reviews, and deployments.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => onViewChange("projects")} size="sm" variant="primary">
            <Plus size={14} />
            <span>New Project</span>
          </Button>
          <Button onClick={() => onViewChange("reviews")} size="sm" variant="secondary">
            <Bot size={14} />
            <span>AI Reviews</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Braces}
          label="Total Projects"
          tone="indigo"
          value={dashboard.counts.projects ?? projects.length}
          helper="Repositories in workspace"
          onClick={() => onViewChange("projects")}
        />
        <KpiCard
          icon={Bot}
          label="AI Code Reviews"
          tone="violet"
          value={dashboard.counts.aiReviews ?? dashboard.reviews.length}
          helper="Analyzed by Groq LLM"
          onClick={() => onViewChange("reviews")}
        />
        <KpiCard
          icon={Rocket}
          label="Deployments"
          tone="emerald"
          value={dashboard.counts.deployments ?? dashboard.deployments.length}
          helper="Builds & release records"
          onClick={() => onViewChange("deployments")}
        />
        <KpiCard
          icon={Users}
          label="Team Collaborators"
          tone="amber"
          value={dashboard.counts.members ?? dashboard.members.length}
          helper="Active workspace members"
          onClick={() => onViewChange("team")}
        />
      </div>

      {/* Main 2-Column Overview Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
        {/* Left Column: Projects & Development */}
        <div className="space-y-5">
          {/* Active Projects Section */}
          <SectionPanel
            action={
              <button
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
                onClick={() => onViewChange("projects")}
                type="button"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            }
            icon={Braces}
            title="Active Projects"
          >
            {projects.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {projects.slice(0, 5).map((project) => (
                  <div
                    className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    key={project.id}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-neutral-900">
                          {project.projectName}
                        </p>
                        <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                          {project.status || "Healthy"}
                        </span>
                        {typeof project.aiScore === "number" && project.aiScore > 0 && (
                          <span className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            <Bot size={10} />
                            Score {project.aiScore}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                        {project.description || "No description provided"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        onClick={() => onOpenProject(project.id, project.projectName)}
                        size="sm"
                        variant="secondary"
                      >
                        <Code2 size={13} />
                        <span>Open IDE</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateBlock
                action={
                  <Button onClick={() => onViewChange("projects")} size="sm" variant="primary">
                    <Plus size={13} />
                    <span>Create Project</span>
                  </Button>
                }
                body="Create your first project to begin developing in the Cloud IDE."
                title="No projects in this workspace"
              />
            )}
          </SectionPanel>

          {/* Recent AI Reviews Snapshot */}
          <SectionPanel
            action={
              <button
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
                onClick={() => onViewChange("reviews")}
                type="button"
              >
                <span>All reviews</span>
                <ArrowRight size={13} />
              </button>
            }
            icon={Bot}
            title="Recent AI Code Reviews"
          >
            {latestReviews.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {latestReviews.map((rev) => (
                  <div
                    className="flex items-center justify-between gap-3 py-2.5"
                    key={rev.id || rev.createdAt}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold",
                            rev.score >= 80
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rev.score >= 60
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                          )}
                        >
                          Score {rev.score}
                        </span>
                        <p className="truncate text-xs font-semibold text-neutral-900">
                          {rev.summary || "Automated code quality review"}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {rev.issues?.length || 0} issues detected • {formatRelativeTime(rev.createdAt)}
                      </p>
                    </div>
                    <Button
                      onClick={() => onViewChange("reviews")}
                      size="sm"
                      variant="ghost"
                    >
                      Inspect
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-neutral-500">
                No code reviews yet. Open any project and click &ldquo;AI Review&rdquo; in the IDE.
              </p>
            )}
          </SectionPanel>

          {/* Recent Deployments Snapshot */}
          <SectionPanel
            action={
              <button
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
                onClick={() => onViewChange("deployments")}
                type="button"
              >
                <span>Deployments</span>
                <ArrowRight size={13} />
              </button>
            }
            icon={Rocket}
            title="Recent Deployments"
          >
            {latestDeployments.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {latestDeployments.map((dep) => (
                  <div
                    className="flex items-center justify-between gap-3 py-2.5"
                    key={dep.id || dep.createdAt}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusPill status={dep.status || "success"} />
                        <span className="text-xs font-medium text-neutral-800">
                          Environment: {dep.environment || "production"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">
                        {dep.url || dep.buildId || "Build finished"} • {formatRelativeTime(dep.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-neutral-500">
                No deployment history recorded yet for this workspace.
              </p>
            )}
          </SectionPanel>
        </div>

        {/* Right Column: Activity Feed & Team Snapshot */}
        <div className="space-y-5">
          {/* Workspace Activity Stream */}
          <SectionPanel icon={Clock} title="Workspace Activity">
            {dashboard.activity.length > 0 ? (
              <div className="space-y-2.5">
                {dashboard.activity.slice(0, 6).map((act) => (
                  <div className="flex items-start gap-2" key={act.id}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                      <ActivityIconComponent action={act.action} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-medium text-neutral-900">
                        {humanizeAction(act.action)}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {act.targetPath || act.targetType || "workspace"} •{" "}
                        {formatRelativeTime(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-neutral-500">
                Workspace activities will appear here as you work.
              </p>
            )}
          </SectionPanel>

          {/* Workspace Members Snapshot */}
          <SectionPanel
            action={
              <button
                className="text-xs font-semibold text-indigo-700 hover:underline"
                onClick={() => onViewChange("team")}
                type="button"
              >
                Manage
              </button>
            }
            icon={Users}
            title="Collaborators"
          >
            {dashboard.members.length > 0 ? (
              <div className="space-y-2">
                {dashboard.members.slice(0, 5).map((member) => {
                  const summary = memberSummary(member);
                  return (
                    <div
                      className="flex items-center justify-between gap-2"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          name={summary.name || summary.email || member.role}
                          photoURL={summary.photoURL}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-neutral-900">
                            {summary.name || summary.email || member.invitedEmail}
                          </p>
                          <p className="text-[10px] text-neutral-400 capitalize">
                            {member.role} • {member.status}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 capitalize">
                        {member.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-neutral-500">
                No members found. Invite teammates to collaborate.
              </p>
            )}
          </SectionPanel>

          {/* Integrations Health */}
          <SectionPanel icon={Database} title="Configured Infrastructure">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 text-xs">
                <span className="font-semibold text-neutral-800">MongoDB Atlas</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Active Provider
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 text-xs">
                <span className="font-semibold text-neutral-800">Firebase Auth</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Configured
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-2.5 text-xs">
                <span className="font-semibold text-neutral-800">Groq LLM Engine</span>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                  Configured
                </span>
              </div>
            </div>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* D. PROJECTS PAGE                                                          */
/* ========================================================================= */

function ProjectsPage({
  createProject,
  projectDescription,
  projectName,
  projects,
  refreshing,
  selectedWorkspace,
  setProjectDescription,
  setProjectName,
  onDeleteProject,
  onOpenProject
}: {
  createProject: (event: FormEvent<HTMLFormElement>) => void;
  projectDescription: string;
  projectName: string;
  projects: Project[];
  refreshing: boolean;
  selectedWorkspace: Workspace;
  setProjectDescription: (value: string) => void;
  setProjectName: (value: string) => void;
  onDeleteProject: (project: Project) => void;
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  const [projectSearch, setProjectSearch] = useState("");

  const displayedProjects = projects.filter((p) => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.projectName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const isFormValid = projectName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-indigo-700 uppercase">
            {selectedWorkspace.workspaceName}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
            Projects Workspace
          </h1>
          <p className="text-xs text-neutral-500">
            Open, manage, and edit repositories with multi-user real-time synchronization and Monaco editor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
            {projects.length} Total Project{projects.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Project Creation Form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-indigo-700" />
            <h2 className="text-sm font-bold text-neutral-950">Create New Project</h2>
          </div>
          <span className="text-[11px] text-neutral-400">
            {isFormValid ? "Ready to create" : "Enter project name to enable creation"}
          </span>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_auto]"
          onSubmit={createProject}
        >
          <input
            className="h-9 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name (e.g. auth-service, devwatch-api)"
            required
            value={projectName}
          />
          <input
            className="h-9 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            onChange={(event) => setProjectDescription(event.target.value)}
            placeholder="Description or repository purpose (optional)"
            value={projectDescription}
          />
          <Button
            disabled={refreshing || !isFormValid}
            size="md"
            type="submit"
            variant="primary"
          >
            <Plus size={14} />
            <span>{refreshing ? "Creating..." : "Create Project"}</span>
          </Button>
        </form>
      </div>

      {/* Projects List with Search */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-sm font-bold text-neutral-950">
            Workspace Repositories ({displayedProjects.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-2.5 text-neutral-400" />
            <input
              className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Filter projects..."
              value={projectSearch}
            />
          </div>
        </div>

        {displayedProjects.length > 0 ? (
          <div
            className={cn(
              "grid gap-4",
              displayedProjects.length === 1
                ? "grid-cols-1 max-w-xl"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {displayedProjects.map((project) => (
              <div
                className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm"
                key={project.id}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <Braces size={15} />
                      </span>
                      <h3 className="truncate text-sm font-bold text-neutral-950">
                        {project.projectName}
                      </h3>
                    </div>
                    <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                      {project.status || "Active"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-neutral-500 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {typeof project.aiScore === "number" && project.aiScore > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        <Bot size={11} />
                        AI Score: {project.aiScore}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                        <Bot size={11} />
                        Not reviewed yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-[10px] text-neutral-400">
                    {project.lastOpenedAt
                      ? `Opened ${formatRelativeTime(project.lastOpenedAt)}`
                      : project.createdAt
                        ? `Created ${formatRelativeTime(project.createdAt)}`
                        : ""}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => onOpenProject(project.id, project.projectName)}
                      size="sm"
                      variant="primary"
                    >
                      <Code2 size={13} />
                      <span>Open IDE</span>
                    </Button>
                    <IconButton
                      label="Delete project"
                      onClick={() => onDeleteProject(project)}
                      size="sm"
                    >
                      <Trash2 size={13} className="text-neutral-400 hover:text-rose-600" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            body={
              projectSearch
                ? "No projects match your search filter."
                : "No projects in this workspace yet. Create one above to get started."
            }
            title={projectSearch ? "No matching projects" : "Workspace is empty"}
          />
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* E. AI CODE REVIEW PAGE                                                    */
/* ========================================================================= */

function ReviewsPage({
  projects,
  reviews,
  onOpenProject
}: {
  projects: Project[];
  reviews: AIReview[];
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
    reviews[0]?.id || null
  );

  const selectedReview =
    reviews.find((r) => r.id === selectedReviewId) || reviews[0] || null;

  const avgScore =
    reviews.length > 0
      ? Math.round(
        reviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / reviews.length
      )
      : 0;

  const totalIssues = reviews.reduce(
    (acc, curr) => acc + (curr.issues?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Sparkles size={12} />
            Groq Llama 3 Inference
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            AI Code Review & Quality
          </h1>
          <p className="text-xs text-neutral-500">
            Automated architectural, security, performance, and bug analysis evaluated directly on your codebase.
          </p>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Bot}
          label="Total Reviews Logged"
          tone="indigo"
          value={reviews.length}
          helper="Stored in MongoDB Atlas"
        />
        <KpiCard
          icon={TrendingUp}
          label="Average Code Score"
          tone="violet"
          value={reviews.length > 0 ? `${avgScore}/100` : "—"}
          helper="Aggregated across reviews"
        />
        <KpiCard
          icon={AlertCircle}
          label="Issues Detected"
          tone="amber"
          value={totalIssues}
          helper="Security, performance, and bugs"
        />
      </div>

      {/* Reviews Explorer */}
      {reviews.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {/* Review List (Left Master) */}
          <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2.5 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              Review History ({reviews.length})
            </h2>
            <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
              {reviews.map((rev) => {
                const isSelected = (rev.id || rev.createdAt) === (selectedReview?.id || selectedReview?.createdAt);
                return (
                  <button
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                    key={rev.id || rev.createdAt}
                    onClick={() => setSelectedReviewId(rev.id || null)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-bold",
                          rev.score >= 80
                            ? "bg-emerald-50 text-emerald-700"
                            : rev.score >= 60
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        )}
                      >
                        Score {rev.score}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {formatRelativeTime(rev.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs font-semibold text-neutral-900">
                      {rev.summary || "Code Quality Review"}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                      <span>{rev.issues?.length || 0} issues</span>
                      <span>•</span>
                      <span>Model: {rev.model || "Groq LLM"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Findings Viewer (Right Detail) */}
          {selectedReview && (
            <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-sm font-bold",
                        selectedReview.score >= 80
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedReview.score >= 60
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      Overall Score: {selectedReview.score}/100
                    </span>
                    <span className="rounded bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                      Analysis: {selectedReview.analysisType || "File"}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-neutral-950">
                    {selectedReview.summary || "Review Findings"}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Generated {formatDate(selectedReview.createdAt)} via Groq engine
                  </p>
                </div>
              </div>

              {/* Sub-scores Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreCard
                  label="Quality"
                  value={selectedReview.qualityScore ?? selectedReview.score}
                />
                <ScoreCard
                  label="Security"
                  value={selectedReview.securityScore ?? selectedReview.score}
                />
                <ScoreCard
                  label="Performance"
                  value={selectedReview.performanceScore ?? selectedReview.score}
                />
                <ScoreCard
                  label="Maintainability"
                  value={selectedReview.maintainabilityScore ?? selectedReview.score}
                />
              </div>

              {/* Issues List */}
              <div>
                <h4 className="mb-2.5 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                  Detected Issues ({selectedReview.issues?.length || 0})
                </h4>

                {selectedReview.issues && selectedReview.issues.length > 0 ? (
                  <div className="space-y-3">
                    {selectedReview.issues.map((issue, idx) => (
                      <div
                        className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                        key={`${issue.title}-${idx}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                issue.severity === "High"
                                  ? "bg-rose-100 text-rose-800"
                                  : issue.severity === "Medium"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-sky-100 text-sky-800"
                              )}
                            >
                              {issue.severity || "Medium"}
                            </span>
                            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                              {issue.type || "Code Quality"}
                            </span>
                            <h5 className="text-xs font-semibold text-neutral-900">
                              {issue.title}
                            </h5>
                          </div>
                          {issue.line && (
                            <span className="font-mono text-[11px] text-neutral-400">
                              Line {issue.line}
                              {issue.column ? `:${issue.column}` : ""}
                            </span>
                          )}
                        </div>

                        {issue.message && (
                          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                            {issue.message}
                          </p>
                        )}

                        {issue.suggestion && (
                          <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
                            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                              Suggested Fix
                            </p>
                            <pre className="mt-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-800">
                              {issue.suggestion}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500">
                    No critical issues detected in this review. Code meets quality thresholds.
                  </p>
                )}
              </div>

              {/* Positives & Next Actions */}
              {(selectedReview.positives?.length || selectedReview.nextActions?.length) ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedReview.positives && selectedReview.positives.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                      <h5 className="text-xs font-bold text-emerald-800 uppercase">
                        Positives
                      </h5>
                      <ul className="mt-2 space-y-1 text-xs text-emerald-950">
                        {selectedReview.positives.map((pos, i) => (
                          <li className="flex items-start gap-1.5" key={i}>
                            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span>{pos}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReview.nextActions && selectedReview.nextActions.length > 0 && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                      <h5 className="text-xs font-bold text-indigo-800 uppercase">
                        Recommended Actions
                      </h5>
                      <ul className="mt-2 space-y-1 text-xs text-indigo-950">
                        {selectedReview.nextActions.map((act, i) => (
                          <li className="flex items-start gap-1.5" key={i}>
                            <ArrowRight size={13} className="mt-0.5 shrink-0 text-indigo-600" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <EmptyStateBlock
          body="Open any project inside the browser IDE, select a file, and click 'AI Review' to generate instant quality analysis."
          title="No AI Code Reviews recorded"
        />
      )}
    </div>
  );
}

/* ========================================================================= */
/* F. DEPLOYMENTS PAGE                                                       */
/* ========================================================================= */

function DeploymentsPage({
  deployments,
  projects,
  onOpenProject
}: {
  deployments: Deployment[];
  projects: Project[];
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  const successCount = deployments.filter((d) => d.status === "success").length;
  const runningCount = deployments.filter((d) => d.status === "running" || d.status === "queued").length;
  const failedCount = deployments.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Rocket size={12} />
            CI/CD Engine
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Deployments & Releases
          </h1>
          <p className="text-xs text-neutral-500">
            Real-time deployment pipelines, preview environments, build records, and release status.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard
          icon={Rocket}
          label="Total Builds"
          tone="indigo"
          value={deployments.length}
          helper="All recorded deployments"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Successful Releases"
          tone="emerald"
          value={successCount}
          helper="Healthy deployments"
        />
        <KpiCard
          icon={Clock}
          label="Active / Queued"
          tone="amber"
          value={runningCount}
          helper="In-flight builds"
        />
        <KpiCard
          icon={AlertCircle}
          label="Failed Builds"
          tone="rose"
          value={failedCount}
          helper="Requires attention"
        />
      </div>

      {/* Deployment Records Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-neutral-950">
          Deployment History ({deployments.length})
        </h2>

        {deployments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400">
                  <th className="pb-3 font-semibold uppercase">Status</th>
                  <th className="pb-3 font-semibold uppercase">Environment</th>
                  <th className="pb-3 font-semibold uppercase">Build ID / Target</th>
                  <th className="pb-3 font-semibold uppercase">Duration</th>
                  <th className="pb-3 font-semibold uppercase">Started</th>
                  <th className="pb-3 text-right font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deployments.map((dep) => (
                  <tr className="transition hover:bg-neutral-50/60" key={dep.id}>
                    <td className="py-3">
                      <StatusPill status={dep.status || "queued"} />
                    </td>
                    <td className="py-3 font-medium text-neutral-900 capitalize">
                      {dep.environment || "preview"}
                    </td>
                    <td className="py-3">
                      {dep.url ? (
                        <a
                          className="inline-flex items-center gap-1 font-mono text-indigo-700 hover:underline"
                          href={dep.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span>{dep.url}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="font-mono text-neutral-600">
                          {dep.buildId || "Standard Build"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-neutral-500">
                      {dep.durationMs ? `${Math.round(dep.durationMs / 1000)}s` : "—"}
                    </td>
                    <td className="py-3 text-neutral-500">
                      {formatDate(dep.startedAt || dep.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      {dep.logs ? (
                        <details className="inline-block text-left">
                          <summary className="cursor-pointer font-semibold text-indigo-700 hover:underline">
                            View Logs
                          </summary>
                          <div className="absolute right-8 z-40 mt-2 max-h-60 w-96 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-900 p-3 font-mono text-[11px] text-neutral-200 shadow-xl">
                            <pre className="whitespace-pre-wrap">{dep.logs}</pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateBlock
            body="Deployment records are populated when build and deployment pipelines report execution data to the API."
            title="No deployments recorded yet"
          />
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* G. MONITORING PAGE (FIXED CHART UNITS & PROPORTIONS)                      */
/* ========================================================================= */

function MonitoringPage({ records }: { records: MonitoringRecord[] }) {
  const hasRecords = records && records.length > 0;
  const latest = hasRecords ? records[0] : null;

  // Chronologically sorted timeline for truthful telemetry
  const chronological = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [records]);

  const computeChartData = useMemo(() => {
    return chronological.map((record) => ({
      name: formatDate(record.createdAt),
      cpu: record.cpu,
      ram: record.ram
    }));
  }, [chronological]);

  const latencyChartData = useMemo(() => {
    return chronological.map((record) => ({
      name: formatDate(record.createdAt),
      latency: record.latency
    }));
  }, [chronological]);

  const systemStatus = !latest
    ? "Awaiting Data"
    : latest.status === "critical" || latest.cpu > 85
      ? "Critical"
      : latest.status === "warning" || latest.cpu > 70
        ? "Warning"
        : "Healthy";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                systemStatus === "Healthy"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : systemStatus === "Warning"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : systemStatus === "Critical"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-neutral-100 text-neutral-600 border border-neutral-200"
              )}
            >
              <Cpu size={12} />
              Status: {systemStatus}
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            System Observability & Monitoring
          </h1>
          <p className="text-xs text-neutral-500">
            Continuous CPU, Memory, Latency, and Uptime metrics recorded for your workspace projects.
          </p>
        </div>
      </div>

      {/* Real-time Telemetry Cards */}
      {hasRecords && latest ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">CPU Load</span>
              <Cpu size={15} className="text-indigo-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{latest.cpu}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  latest.cpu > 80 ? "bg-rose-500" : latest.cpu > 50 ? "bg-amber-500" : "bg-indigo-600"
                )}
                style={{ width: `${Math.min(100, Math.max(0, latest.cpu))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-400">Processor core utilization</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Memory (RAM)</span>
              <HardDrive size={15} className="text-emerald-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{latest.ram}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, latest.ram))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-400">Allocated RAM pool</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Response Latency</span>
              <Zap size={15} className="text-rose-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{latest.latency}ms</p>
            <p className="mt-2 text-[10px] text-neutral-500">
              {latest.latency < 100
                ? "Optimal (< 100ms)"
                : latest.latency < 300
                  ? "Moderate (100–300ms)"
                  : "Elevated (> 300ms)"}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">System Uptime</span>
              <ShieldCheck size={15} className="text-sky-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-950">
              {latest.uptime !== undefined ? `${latest.uptime}%` : "100%"}
            </p>
            <p className="mt-2 text-[10px] text-neutral-400">Recorded SLA availability</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-500">
          Telemetry stream inactive. Workspace runtime metrics will appear here once ingested.
        </div>
      )}

      {/* Synchronized Telemetry Charts (Separated Scales to Avoid 2400 vs 100% Flattening) */}
      {hasRecords && computeChartData.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Chart 1: Compute Utilization (CPU & RAM in %) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
                  Compute & Memory Utilization (%)
                </h3>
                <p className="text-[11px] text-neutral-400">Scale: 0% to 100% allocation</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-700" /> CPU (%)
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-700" /> RAM (%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={computeChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <Line dataKey="cpu" stroke="#4338ca" strokeWidth={2} dot={false} type="monotone" />
                  <Line dataKey="ram" stroke="#059669" strokeWidth={2} dot={false} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Latency (in ms) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
                  API & Network Latency (ms)
                </h3>
                <p className="text-[11px] text-neutral-400">Scale: Milliseconds elapsed</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <span className="h-2 w-2 rounded-full bg-rose-700" /> Latency (ms)
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={latencyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="ms" />
                  <Tooltip />
                  <Line dataKey="latency" stroke="#e11d48" strokeWidth={2} dot={false} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <EmptyStateBlock
          body="Push monitoring records via the telemetry API to populate real-time CPU, RAM, latency, and uptime charts."
          title="No telemetry records captured yet"
        />
      )}

      {/* Telemetry Log Table */}
      {records.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-neutral-950">
            Telemetry Record Log ({records.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400">
                  <th className="pb-3 font-semibold uppercase">Timestamp</th>
                  <th className="pb-3 font-semibold uppercase">Status</th>
                  <th className="pb-3 font-semibold uppercase">CPU</th>
                  <th className="pb-3 font-semibold uppercase">RAM</th>
                  <th className="pb-3 font-semibold uppercase">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((rec) => (
                  <tr className="transition hover:bg-neutral-50/60" key={rec.id}>
                    <td className="py-2.5 font-mono text-neutral-700">
                      {formatDate(rec.createdAt)}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 capitalize">
                        {rec.status || "healthy"}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-neutral-900">{rec.cpu}%</td>
                    <td className="py-2.5 font-semibold text-neutral-900">{rec.ram}%</td>
                    <td className="py-2.5 font-semibold text-neutral-900">{rec.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* H. ALERTS PAGE                                                            */
/* ========================================================================= */

function AlertsPage({ notifications }: { notifications: NotificationRecord[] }) {
  const [filter, setFilter] = useState<"all" | "unread" | "ai" | "system">("all");

  const filtered = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "ai") return item.type === "ai-alert";
    if (filter === "system") return item.type === "system" || item.type === "deployment";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Bell size={12} />
            Notifications & Incidents
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Alerts & Notifications
          </h1>
          <p className="text-xs text-neutral-500">
            Real-time incident reports, AI warnings, team mentions, and deployment alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
              {unreadCount} Unread
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              All caught up
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-3">
        {(["all", "unread", "ai", "system"] as const).map((tab) => (
          <button
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold capitalize transition",
              filter === tab
                ? "bg-indigo-700 text-white shadow-sm"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            )}
            key={tab}
            onClick={() => setFilter(tab)}
            type="button"
          >
            {tab === "all" ? "All Alerts" : tab === "ai" ? "AI Alerts" : tab}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {filtered.map((item) => (
              <div
                className={cn(
                  "flex items-start gap-3 py-3.5 transition",
                  !item.read && "bg-indigo-50/20 -mx-5 px-5"
                )}
                key={item.id}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    item.type === "ai-alert"
                      ? "bg-violet-50 text-violet-700"
                      : item.type === "deployment"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {item.type === "ai-alert" ? (
                    <Bot size={15} />
                  ) : item.type === "deployment" ? (
                    <Rocket size={15} />
                  ) : (
                    <Bell size={15} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-neutral-950">{item.message}</p>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Type: {item.type || "system"} • {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-semibold",
                    item.read
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-indigo-100 text-indigo-700"
                  )}
                >
                  {item.read ? "Read" : "Unread"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Bell size={24} className="mx-auto text-neutral-300" />
            <h3 className="mt-2 text-xs font-bold text-neutral-900">No alerts found</h3>
            <p className="mt-1 text-xs text-neutral-500">
              There are no notifications matching the current filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* I. ANALYTICS PAGE (FIXED SINGLE-PROJECT BENCHMARK)                        */
/* ========================================================================= */

function AnalyticsPage({
  projects,
  reviews
}: {
  projects: Project[];
  reviews: AIReview[];
}) {
  const scoredProjects = projects.filter(
    (project) => typeof project.aiScore === "number" && project.aiScore > 0
  );

  const projectScores = scoredProjects.map((project) => ({
    name: project.projectName,
    score: project.aiScore || 0
  }));

  const reviewScores = reviews.map((review, index) => ({
    name: `Rev ${reviews.length - index}`,
    score: review.score || 0
  }));

  const hasMultipleProjects = projectScores.length > 1;
  const hasSingleProject = projectScores.length === 1;
  const singleProject = hasSingleProject ? scoredProjects[0] : null;

  const avgScore =
    projectScores.length > 0
      ? Math.round(projectScores.reduce((a, b) => a + b.score, 0) / projectScores.length)
      : reviews.length > 0
        ? Math.round(reviews.reduce((a, b) => a + (b.score || 0), 0) / reviews.length)
        : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <BarChart3 size={12} />
            Quality Analytics
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Engineering Analytics & Insights
          </h1>
          <p className="text-xs text-neutral-500">
            Quality scores and benchmarks generated from your stored project and review records.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Braces}
          label="Projects Evaluated"
          tone="indigo"
          value={scoredProjects.length}
          helper="Projects with AI scores"
        />
        <KpiCard
          icon={TrendingUp}
          label="Average Quality Score"
          tone="violet"
          value={avgScore > 0 ? `${avgScore}/100` : "—"}
          helper="Weighted benchmark"
        />
        <KpiCard
          icon={Bot}
          label="Total Reviews Conducted"
          tone="emerald"
          value={reviews.length}
          helper="Automated Groq reviews"
        />
      </div>

      {/* Single Project Evaluation Card OR Multi-Project Benchmark */}
      {hasSingleProject && singleProject ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                Single Project Assessment
              </span>
              <h2 className="mt-2 text-base font-bold text-neutral-950">
                {singleProject.projectName} — AI Quality Score
              </h2>
              <p className="text-xs text-neutral-500">
                Evaluated through automated code analysis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xl font-bold text-indigo-800">
                {singleProject.aiScore}/100
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-900">Comparative Benchmark Note</p>
            <p className="mt-1 leading-relaxed">
              Currently, only 1 project has an AI review score in this workspace. Create additional projects or run code reviews on other repositories to enable comparative cross-project benchmarking.
            </p>
          </div>
        </div>
      ) : hasMultipleProjects ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-neutral-950">
              Cross-Project Quality Comparison
            </h2>
            <p className="text-xs text-neutral-400">
              Score benchmark across evaluated repositories
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={projectScores}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#4338ca" radius={[4, 4, 0, 0]}>
                  {projectScores.map((entry, index) => (
                    <Cell
                      fill={
                        entry.score >= 80
                          ? "#059669"
                          : entry.score >= 60
                            ? "#4338ca"
                            : "#e11d48"
                      }
                      key={`cell-${index}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : reviewScores.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-neutral-950">
              Review Run Score History
            </h2>
            <p className="text-xs text-neutral-400">
              Score progression across recent Groq AI review runs
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={reviewScores}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#4338ca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyStateBlock
          body="Run AI code reviews or create scored projects to view real-time quality and performance analytics."
          title="No analytics records available"
        />
      )}

      {/* Project Health Breakdown Table */}
      {projects.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-neutral-950">
            Project Health Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400">
                  <th className="pb-3 font-semibold uppercase">Project Name</th>
                  <th className="pb-3 font-semibold uppercase">Status</th>
                  <th className="pb-3 font-semibold uppercase">AI Score</th>
                  <th className="pb-3 font-semibold uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {projects.map((proj) => (
                  <tr className="transition hover:bg-neutral-50/60" key={proj.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">
                      {proj.projectName}
                    </td>
                    <td className="py-2.5 text-neutral-600">{proj.status || "Active"}</td>
                    <td className="py-2.5">
                      {typeof proj.aiScore === "number" && proj.aiScore > 0 ? (
                        <span className="font-bold text-indigo-700">
                          {proj.aiScore}/100
                        </span>
                      ) : (
                        <span className="text-neutral-400">Pending review</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {typeof proj.aiScore === "number" && proj.aiScore >= 80 ? (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Optimal
                        </span>
                      ) : typeof proj.aiScore === "number" && proj.aiScore >= 60 ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Moderate
                        </span>
                      ) : (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                          Standard
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* J. MEMBERS PAGE                                                           */
/* ========================================================================= */

function TeamPage({
  members,
  onChanged,
  token,
  user,
  workspaceId
}: {
  members: Member[];
  onChanged: () => void;
  token: string;
  user: UserSession;
  workspaceId: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentMember = members.find((member) => {
    const summary = memberSummary(member);
    return summary.id === user.id || summary._id === user.id || summary.email === user.email;
  });
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiData("/api/invites", {
        method: "POST",
        token,
        body: { workspaceId, email, role }
      });
      setEmail("");
      setMessage("Invitation sent successfully.");
      onChanged();
    } catch (inviteError) {
      setMessage(errorMessage(inviteError));
    } finally {
      setBusy(false);
    }
  }

  async function updateMember(member: Member, nextRole?: string) {
    if (!nextRole && !window.confirm("Remove this member from the workspace?")) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await apiData(`/api/members/${member.id}`, {
        method: nextRole ? "PATCH" : "DELETE",
        token,
        body: nextRole ? { role: nextRole } : undefined
      });
      onChanged();
    } catch (memberError) {
      setMessage(errorMessage(memberError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Users size={12} />
            Team & Permissions
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Workspace Members
          </h1>
          <p className="text-xs text-neutral-500">
            Manage developer access, assign administrative roles, and invite collaborators.
          </p>
        </div>
        <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
          {members.length} Member{members.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Invite Member Card */}
      {canManage && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-neutral-950">Invite New Teammate</h2>
          <form className="flex flex-wrap gap-2.5" onSubmit={invite}>
            <input
              className="h-9 min-w-[240px] flex-1 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
              type="email"
              value={email}
            />
            <select
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500"
              onChange={(e) => setRole(e.target.value as typeof role)}
              value={role}
            >
              <option value="admin">Admin (Full Management)</option>
              <option value="developer">Developer (Edit & Review)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
            <Button disabled={busy || !email.trim()} size="md" type="submit" variant="primary">
              <UserPlus size={14} />
              <span>Send Invitation</span>
            </Button>
          </form>
        </div>
      )}

      {message && <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">{message}</div>}

      {/* Member List */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-neutral-950">
          Current Members ({members.length})
        </h2>

        {members.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {members.map((member) => {
              const summary = memberSummary(member);
              const isOwner = member.role === "owner";
              return (
                <div
                  className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                  key={member.id}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={summary.name || summary.email || member.role}
                      photoURL={summary.photoURL}
                    />
                    <div>
                      <p className="text-xs font-semibold text-neutral-950">
                        {summary.name || summary.email || member.invitedEmail || "Member"}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {summary.email || member.invitedEmail} • Status:{" "}
                        <span className="capitalize text-neutral-600">{member.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner || !canManage ? (
                      <span className="rounded bg-neutral-100 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-700">
                        {member.role}
                      </span>
                    ) : (
                      <>
                        <select
                          className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none"
                          disabled={busy}
                          onChange={(e) => void updateMember(member, e.target.value)}
                          value={member.role}
                        >
                          <option value="admin">Admin</option>
                          <option value="developer">Developer</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <IconButton
                          disabled={busy}
                          label="Remove member"
                          onClick={() => void updateMember(member)}
                          size="sm"
                        >
                          <Trash2 size={13} className="text-neutral-400 hover:text-rose-600" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyStateBlock
            body="No members loaded. Invite your team members using the form above."
            title="No collaborators in workspace"
          />
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* K. INTEGRATIONS PAGE (PROPORTIONED & TRUTHFUL CONFIGURATION)              */
/* ========================================================================= */

function IntegrationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Database size={12} />
            Services & Infrastructure
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Integrations & Runtime
          </h1>
          <p className="text-xs text-neutral-500">
            Services configured in your runtime environment for database storage, authentication, and AI inference.
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* MongoDB Atlas */}
        <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Database size={18} />
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Configured via Env
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-neutral-950">MongoDB Atlas</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Primary document database storing workspaces, project records, file contents, chat, AI reviews, and telemetry logs.
            </p>
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-2.5 text-[11px] text-neutral-400">
            Key: <code className="font-mono text-neutral-700">MONGODB_URI</code>
          </div>
        </div>

        {/* Firebase Authentication */}
        <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <ShieldCheck size={18} />
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Configured via Env
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-neutral-950">Firebase Authentication</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Identity verification and token session handling for email/password and Google OAuth credentials.
            </p>
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-2.5 text-[11px] text-neutral-400">
            Client & Admin SDKs configured
          </div>
        </div>

        {/* Groq API */}
        <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Bot size={18} />
              </span>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                Configured via Env
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-neutral-950">Groq LLM Engine</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              High-throughput LPU inference powering AST code quality analysis, security vulnerability detection, and auto-fix previews.
            </p>
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-2.5 text-[11px] text-neutral-400">
            Key: <code className="font-mono text-neutral-700">GROQ_API_KEY</code>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* L. SETTINGS PAGE                                                          */
/* ========================================================================= */

function SettingsPage({
  createWorkspace,
  refreshing,
  selectedWorkspace,
  setWorkspaceName,
  workspaceName
}: {
  createWorkspace: (event: FormEvent<HTMLFormElement>) => void;
  refreshing: boolean;
  selectedWorkspace: Workspace;
  setWorkspaceName: (value: string) => void;
  workspaceName: string;
}) {
  const isWorkspaceValid = workspaceName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
            <Settings size={12} />
            Preferences
          </span>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-neutral-950">
            Workspace Settings
          </h1>
          <p className="text-xs text-neutral-500">
            Active workspace information and configuration.
          </p>
        </div>
      </div>

      {/* Active Workspace Info */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">Active Workspace Details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Workspace Name
            </p>
            <p className="mt-1 text-xs font-bold text-neutral-900">
              {selectedWorkspace.workspaceName}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Workspace Slug / Identifier
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-900">
              {selectedWorkspace.slug || selectedWorkspace.id}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Created Date
            </p>
            <p className="mt-1 text-xs text-neutral-700">
              {formatDate(selectedWorkspace.createdAt)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Persistent Database
            </p>
            <p className="mt-1 text-xs text-neutral-700">MongoDB Atlas</p>
          </div>
        </div>
      </div>

      {/* Create Another Workspace Form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">Create Another Workspace</h2>
        <p className="text-xs text-neutral-500">
          Workspaces organize distinct teams, repositories, and cloud resources.
        </p>
        <form className="mt-3 flex flex-col gap-2.5 sm:flex-row" onSubmit={createWorkspace}>
          <input
            className="h-9 min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="New workspace name (e.g. Acme Corp, Engineering)"
            value={workspaceName}
          />
          <Button
            disabled={refreshing || !isWorkspaceValid}
            size="md"
            type="submit"
            variant="primary"
          >
            <Plus size={14} />
            <span>{refreshing ? "Creating..." : "Create Workspace"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* REUSABLE UI PRIMITIVES & HELPERS                                          */
/* ========================================================================= */

function KpiCard({
  helper,
  icon: Icon,
  label,
  onClick,
  tone,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  helper?: string;
  tone: "indigo" | "violet" | "emerald" | "amber" | "rose";
  onClick?: () => void;
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition",
        onClick && "cursor-pointer hover:border-neutral-300 hover:shadow"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
          {label}
        </span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}>
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{value}</p>
      {helper && <p className="mt-0.5 text-[10px] text-neutral-400">{helper}</p>}
    </div>
  );
}

function SectionPanel({
  action,
  children,
  icon: Icon,
  title
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-indigo-700" />}
          <h2 className="text-sm font-bold text-neutral-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const isSuccess = status === "success" || status === "Healthy";
  const isRunning = status === "running" || status === "queued";
  const isFailed = status === "failed";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        isSuccess
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : isRunning
            ? "bg-sky-50 text-sky-700 border border-sky-200"
            : isFailed
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-neutral-100 text-neutral-700 border border-neutral-200"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isSuccess
            ? "bg-emerald-600"
            : isRunning
              ? "bg-sky-600 animate-pulse"
              : isFailed
                ? "bg-rose-600"
                : "bg-neutral-500"
        )}
      />
      {status}
    </span>
  );
}

function ScoreCard({ label, value }: { label: string; value?: number }) {
  const numeric = typeof value === "number" ? value : 0;
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
      <p className="mt-1 text-base font-bold text-neutral-900">{numeric}</p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={cn(
            "h-full rounded-full",
            numeric >= 80 ? "bg-emerald-600" : numeric >= 60 ? "bg-amber-500" : "bg-rose-500"
          )}
          style={{ width: `${Math.min(100, numeric)}%` }}
        />
      </div>
    </div>
  );
}

function EmptyStateBlock({
  action,
  body,
  title
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center">
      <h3 className="text-xs font-bold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">{body}</p>
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
      <AlertTriangle size={15} className="shrink-0 text-rose-600" />
      <span>{message}</span>
    </div>
  );
}

function NoWorkspaceForm({
  creating,
  onSubmit,
  setWorkspaceName,
  workspaceName
}: {
  creating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setWorkspaceName: (value: string) => void;
  workspaceName: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Server size={22} />
        </span>
        <h2 className="mt-3 text-base font-bold text-neutral-950">
          Create Your Workspace
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Every project, code file, and AI review in DevWatch AI lives inside a workspace.
        </p>
      </div>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <input
          className="h-9 w-full rounded-lg border border-neutral-200 px-3 text-xs text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="Workspace name (e.g. Engineering, DevWatch Team)"
          required
          value={workspaceName}
        />
        <Button
          className="w-full"
          disabled={creating || !workspaceName.trim()}
          size="md"
          type="submit"
          variant="primary"
        >
          <Plus size={14} />
          <span>Create Workspace</span>
        </Button>
      </form>
    </div>
  );
}

function Avatar({ name, photoURL }: { name: string; photoURL?: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-800">
      {photoURL ? (
        <img alt={name} className="h-full w-full object-cover" src={photoURL} />
      ) : (
        initials(name || "User")
      )}
    </span>
  );
}

function ActivityIconComponent({ action }: { action: string }) {
  if (action.includes("project")) return <Braces size={11} />;
  if (action.includes("review") || action.includes("ai")) return <Bot size={11} />;
  if (action.includes("deployment")) return <Rocket size={11} />;
  if (action.includes("member")) return <Users size={11} />;
  return <LayoutDashboard size={11} />;
}

function memberSummary(member: Member) {
  if (member.userId && typeof member.userId === "object") {
    return member.userId;
  }
  return {
    name: "",
    email: member.invitedEmail || "",
    photoURL: ""
  };
}

function humanizeAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatRelativeTime(value?: string) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
