"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Braces,
  ChevronsUpDown,
  Code2,
  Cpu,
  Database,
  LayoutDashboard,
  LogOut,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui";
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

type DashboardView = Exclude<AppView, "landing" | "ide">;

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

const navGroups: Array<{
  label: string;
  items: Array<{ label: string; view: DashboardView; icon: LucideIcon }>;
}> = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", view: "overview", icon: LayoutDashboard },
      { label: "Projects", view: "projects", icon: Braces },
      { label: "AI Code Review", view: "reviews", icon: Bot },
      { label: "Deployments", view: "deployments", icon: Rocket }
    ]
  },
  {
    label: "Insights",
    items: [
      { label: "Monitoring", view: "monitoring", icon: Cpu },
      { label: "Alerts", view: "alerts", icon: AlertTriangle },
      { label: "Analytics", view: "analytics", icon: BarChart3 }
    ]
  },
  {
    label: "Team",
    items: [
      { label: "Members", view: "team", icon: Users },
      { label: "Integrations", view: "integrations", icon: Database }
    ]
  },
  {
    label: "System",
    items: [{ label: "Settings", view: "settings", icon: Settings }]
  }
];

export function WorkspaceShell({
  view,
  onViewChange,
  onOpenProject,
  onHome,
  user,
  onSignOut
}: {
  view: DashboardView;
  onViewChange: (view: AppView) => void;
  onOpenProject: (projectId: string, projectName?: string) => void;
  onHome: () => void;
  user: UserSession;
  onSignOut: () => void;
}) {
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

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);
  const allNavItems = navGroups.flatMap((group) => group.items);
  const unreadCount = dashboard.notifications.filter((item) => !item.read).length;
  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [project.projectName, project.description, project.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
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

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#f7f8fb] text-neutral-950">
      <aside className="hidden w-[268px] shrink-0 border-r border-neutral-200 bg-white p-4 lg:flex lg:flex-col">
        <button
          className="mb-6 flex items-center gap-3 rounded-md p-1 text-left hover:bg-neutral-50"
          onClick={onHome}
          type="button"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-700 text-sm font-semibold text-white">
            DW
          </span>
          <span className="text-lg font-semibold">
            DevWatch <span className="text-indigo-700">AI</span>
          </span>
        </button>

        <div className="space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-xs font-semibold text-neutral-500">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <NavButton
                    active={view === item.view}
                    icon={item.icon}
                    key={item.view}
                    label={item.label}
                    onClick={() => onViewChange(item.view)}
                    badge={item.view === "alerts" && unreadCount ? unreadCount : undefined}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} photoURL={user.photoURL} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-950">{user.name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
            <button
              aria-label="Sign out"
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              onClick={onSignOut}
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-200 px-3 py-2">
                <Search size={16} className="shrink-0 text-neutral-500" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects"
                  value={search}
                />
              </div>
              {workspaces.length ? (
                <select
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium outline-none"
                  onChange={(event) => setWorkspaceId(event.target.value)}
                  value={workspaceId}
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.workspaceName}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Alerts"
                className="relative flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                onClick={() => onViewChange("alerts")}
                type="button"
              >
                <Bell size={16} />
                {unreadCount ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-rose-600 px-1 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
              <div className="relative">
                <details>
                  <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800">
                    <Plus size={16} />
                    New
                    <ChevronsUpDown size={14} />
                  </summary>
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-lg border border-neutral-200 bg-white p-2">
                    <MenuAction label="New Workspace" onClick={() => onViewChange("settings")} />
                    <MenuAction label="New Project" onClick={() => onViewChange("projects")} />
                    <MenuAction label="Start AI Review" onClick={() => onViewChange("reviews")} />
                    <MenuAction label="Invite Member" onClick={() => onViewChange("team")} />
                  </div>
                </details>
              </div>
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {allNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium",
                    view === item.view
                      ? "border-indigo-700 bg-indigo-700 text-white"
                      : "border-neutral-200 bg-white text-neutral-700"
                  )}
                  key={item.view}
                  onClick={() => onViewChange(item.view)}
                  type="button"
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-y-auto p-4 lg:p-6">
            {error ? <ErrorBanner message={error} /> : null}
            {loading ? (
              <EmptyState title="Loading workspace" body="Fetching your MongoDB-backed workspace data." />
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
                onOpenProject={onOpenProject}
              />
            )}
          </section>
          <RightPanel dashboard={dashboard} workspace={selectedWorkspace} />
        </div>
      </section>
    </main>
  );
}

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
  onOpenProject
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
  view: DashboardView;
  workspaceName: string;
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  if (view === "overview") {
    return (
      <OverviewPage
        dashboard={dashboard}
        projects={projects}
        selectedWorkspace={selectedWorkspace}
        onOpenProject={onOpenProject}
      />
    );
  }

  if (view === "projects") {
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
        onOpenProject={onOpenProject}
      />
    );
  }

  if (view === "reviews") return <ReviewsPage reviews={dashboard.reviews} />;
  if (view === "deployments") return <DeploymentsPage deployments={dashboard.deployments} />;
  if (view === "monitoring") return <MonitoringPage records={dashboard.monitoring} />;
  if (view === "alerts") return <AlertsPage notifications={dashboard.notifications} />;
  if (view === "analytics") return <AnalyticsPage projects={projects} reviews={dashboard.reviews} />;
  if (view === "team") return <TeamPage members={dashboard.members} user={user} />;
  if (view === "integrations") return <IntegrationsPage />;

  return (
    <SettingsPage
      createWorkspace={createWorkspace}
      refreshing={refreshing}
      selectedWorkspace={selectedWorkspace}
      setWorkspaceName={setWorkspaceName}
      workspaceName={workspaceName}
    />
  );
}

function OverviewPage({
  dashboard,
  projects,
  selectedWorkspace,
  onOpenProject
}: {
  dashboard: DashboardData;
  projects: Project[];
  selectedWorkspace: Workspace;
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={selectedWorkspace.workspaceName}
        title="Workspace Overview"
        body="Live counts below come from MongoDB records attached to this workspace."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Projects" value={dashboard.counts.projects || projects.length} />
        <Metric label="AI Reviews" value={dashboard.counts.aiReviews || 0} />
        <Metric label="Deployments" value={dashboard.counts.deployments || 0} />
        <Metric label="Members" value={dashboard.counts.members || 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent Projects">
          {projects.length ? (
            <div className="divide-y divide-neutral-200">
              {projects.slice(0, 5).map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onOpenProject={onOpenProject}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No projects yet" body="Create a project to open the Cloud IDE." />
          )}
        </Panel>
        <Panel title="Activity">
          <ActivityList activity={dashboard.activity} />
        </Panel>
      </div>
    </div>
  );
}

function ProjectsPage({
  createProject,
  projectDescription,
  projectName,
  projects,
  refreshing,
  selectedWorkspace,
  setProjectDescription,
  setProjectName,
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
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={selectedWorkspace.workspaceName}
        title="Projects"
        body="Projects are stored in MongoDB and open inside the browser IDE."
      />
      <form
        className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={createProject}
      >
        <input
          className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="Project name"
          value={projectName}
        />
        <input
          className="h-10 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setProjectDescription(event.target.value)}
          placeholder="Description"
          value={projectDescription}
        />
        <Button disabled={refreshing || !projectName.trim()} type="submit" variant="primary">
          <Plus size={16} />
          Create Project
        </Button>
      </form>
      <Panel title="Project List">
        {projects.length ? (
          <div className="divide-y divide-neutral-200">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpenProject={onOpenProject}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No matching projects" body="Create a project or clear the search field." />
        )}
      </Panel>
    </div>
  );
}

function ReviewsPage({ reviews }: { reviews: AIReview[] }) {
  return (
    <DataPage
      title="AI Code Review"
      body="Groq review results appear here after you run a review from the IDE."
      emptyTitle="No AI reviews yet"
      emptyBody="Open a project, choose a file, and run AI Review."
      items={reviews}
      renderItem={(review) => (
        <DataRow
          key={review.id || review.reviewId || review.createdAt}
          title={`Score ${review.score}`}
          meta={review.summary || "Review completed"}
          detail={`${review.issues?.length || 0} issue records`}
          icon={<Bot size={17} />}
        />
      )}
    />
  );
}

function DeploymentsPage({ deployments }: { deployments: Deployment[] }) {
  return (
    <DataPage
      title="Deployments"
      body="Deployment records are listed when the backend receives real deployment events."
      emptyTitle="No deployments yet"
      emptyBody="Connect a deployment flow or create deployment records from the backend."
      items={deployments}
      renderItem={(deployment) => (
        <DataRow
          key={deployment.id}
          title={deployment.status || "queued"}
          meta={deployment.environment || "preview"}
          detail={deployment.url || deployment.buildId || formatDate(deployment.createdAt)}
          icon={<Rocket size={17} />}
        />
      )}
    />
  );
}

function MonitoringPage({ records }: { records: MonitoringRecord[] }) {
  const latest = records[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        body="This page stays empty until real monitoring records exist for workspace projects."
      />
      {latest ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="CPU" value={`${latest.cpu}%`} />
          <Metric label="RAM" value={`${latest.ram}%`} />
          <Metric label="Latency" value={`${latest.latency}ms`} />
          <Metric label="Uptime" value={`${latest.uptime ?? 0}%`} />
        </div>
      ) : null}
      <DataPage
        title="Monitoring Records"
        body=""
        emptyTitle="No monitoring records yet"
        emptyBody="Push monitoring records to the API to populate CPU, RAM, latency, uptime, and alert history."
        items={records}
        renderItem={(record) => (
          <DataRow
            key={record.id}
            title={record.status || "healthy"}
            meta={`CPU ${record.cpu}% · RAM ${record.ram}%`}
            detail={`Latency ${record.latency}ms`}
            icon={<Cpu size={17} />}
          />
        )}
      />
    </div>
  );
}

function AlertsPage({ notifications }: { notifications: NotificationRecord[] }) {
  return (
    <DataPage
      title="Alerts"
      body="Notifications are user-scoped records stored in MongoDB."
      emptyTitle="No alerts"
      emptyBody="Mentions, AI warnings, deployment updates, and system notifications will appear here."
      items={notifications}
      renderItem={(notification) => (
        <DataRow
          key={notification.id}
          title={notification.message}
          meta={notification.type || "system"}
          detail={notification.read ? "Read" : "Unread"}
          icon={<Bell size={17} />}
        />
      )}
    />
  );
}

function AnalyticsPage({
  projects,
  reviews
}: {
  projects: Project[];
  reviews: AIReview[];
}) {
  const projectScores = projects
    .filter((project) => typeof project.aiScore === "number")
    .map((project) => ({
      name: project.projectName,
      score: project.aiScore || 0
    }));
  const reviewScores = reviews.map((review, index) => ({
    name: `Review ${reviews.length - index}`,
    score: review.score || 0
  }));
  const chartData = projectScores.length ? projectScores : reviewScores;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        body="Charts are generated only from stored project and AI review records."
      />
      {chartData.length ? (
        <Panel title="AI Score Trend">
          <div className="h-[340px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#4338ca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : (
        <EmptyState
          title="No analytics yet"
          body="Run AI reviews or create projects with score records to populate analytics."
        />
      )}
    </div>
  );
}

function TeamPage({ members, user }: { members: Member[]; user: UserSession }) {
  return (
    <DataPage
      title="Team"
      body="Workspace member roles and status come from the Members collection."
      emptyTitle="No members loaded"
      emptyBody={`${user.name} is signed in. Workspace member records appear here after they are created.`}
      items={members}
      renderItem={(member) => {
        const summary = memberSummary(member);
        return (
          <DataRow
            key={member.id}
            title={summary.name || summary.email || member.invitedEmail || "Member"}
            meta={member.role}
            detail={member.status}
            icon={<Users size={17} />}
          />
        );
      }}
    />
  );
}

function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        body="Runtime integrations are configured with server environment variables and provider credentials."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <IntegrationCard
          icon={<Database size={20} />}
          title="MongoDB Atlas"
          body="Used by backend models for workspaces, projects, files, chat, reviews, monitoring, and alerts."
        />
        <IntegrationCard
          icon={<ShieldCheck size={20} />}
          title="Firebase Auth"
          body="Used by the frontend for email/password and Google sign-in."
        />
        <IntegrationCard
          icon={<Bot size={20} />}
          title="Groq API"
          body="Used by AI review, suggestions, bug detection, auto-fix, chat, and project analysis."
        />
      </div>
    </div>
  );
}

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
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        body="Create additional workspaces and review the active workspace."
      />
      <Panel title="Active Workspace">
        <DataRow
          title={selectedWorkspace.workspaceName}
          meta={selectedWorkspace.slug || "workspace"}
          detail={formatDate(selectedWorkspace.createdAt)}
          icon={<Settings size={17} />}
        />
      </Panel>
      <NoWorkspaceForm
        creating={refreshing}
        onSubmit={createWorkspace}
        setWorkspaceName={setWorkspaceName}
        title="Create Another Workspace"
        workspaceName={workspaceName}
      />
    </div>
  );
}

function RightPanel({
  dashboard,
  workspace
}: {
  dashboard: DashboardData;
  workspace?: Workspace;
}) {
  return (
    <aside className="hidden min-h-0 border-l border-neutral-200 bg-white p-4 xl:block xl:overflow-y-auto">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            {workspace?.workspaceName || "Workspace"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Team and activity snapshot</p>
        </div>
        <Panel title="Members">
          {dashboard.members.length ? (
            <div className="space-y-3">
              {dashboard.members.slice(0, 6).map((member) => {
                const summary = memberSummary(member);
                return (
                  <div className="flex items-center gap-3" key={member.id}>
                    <Avatar name={summary.name || summary.email || member.role} photoURL={summary.photoURL} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-950">
                        {summary.name || summary.email || member.role}
                      </p>
                      <p className="text-xs text-neutral-500">{member.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No members" body="Member records will appear here." compact />
          )}
        </Panel>
        <Panel title="Recent Activity">
          <ActivityList activity={dashboard.activity.slice(0, 6)} compact />
        </Panel>
      </div>
    </aside>
  );
}

function ProjectRow({
  project,
  onOpenProject
}: {
  project: Project;
  onOpenProject: (projectId: string, projectName?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-950">
          {project.projectName}
        </p>
        <p className="mt-1 truncate text-sm text-neutral-500">
          {project.description || "No description"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600">
          {project.status || "Healthy"}
        </span>
        {typeof project.aiScore === "number" && project.aiScore > 0 ? (
          <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800">
            AI {project.aiScore}
          </span>
        ) : null}
        <Button onClick={() => onOpenProject(project.id, project.projectName)}>
          <Code2 size={16} />
          Open
        </Button>
      </div>
    </div>
  );
}

function DataPage<T>({
  body,
  emptyBody,
  emptyTitle,
  items,
  renderItem,
  title
}: {
  body: string;
  emptyBody: string;
  emptyTitle: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  title: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader body={body} title={title} />
      <Panel title={title}>
        {items.length ? (
          <div className="divide-y divide-neutral-200">{items.map(renderItem)}</div>
        ) : (
          <EmptyState body={emptyBody} title={emptyTitle} />
        )}
      </Panel>
    </div>
  );
}

function ActivityList({
  activity,
  compact = false
}: {
  activity: Activity[];
  compact?: boolean;
}) {
  if (!activity.length) {
    return <EmptyState title="No activity yet" body="Workspace actions will appear here." compact={compact} />;
  }

  return (
    <div className="divide-y divide-neutral-200">
      {activity.map((item) => (
        <DataRow
          detail={formatDate(item.createdAt)}
          icon={<LayoutDashboard size={17} />}
          key={item.id}
          meta={item.targetPath || item.targetType || "workspace"}
          title={humanizeAction(item.action)}
        />
      ))}
    </div>
  );
}

function DataRow({
  detail,
  icon,
  meta,
  title
}: {
  detail?: string;
  icon: ReactNode;
  meta?: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-neutral-950">{title}</p>
        {meta ? <p className="mt-1 break-words text-sm text-neutral-600">{meta}</p> : null}
      </div>
      {detail ? (
        <span className="shrink-0 text-right text-xs text-neutral-500">{detail}</span>
      ) : null}
    </div>
  );
}

function NoWorkspaceForm({
  creating,
  onSubmit,
  setWorkspaceName,
  title = "Create Your First Workspace",
  workspaceName
}: {
  creating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setWorkspaceName: (value: string) => void;
  title?: string;
  workspaceName: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <PageHeader
        body="Everything in DevWatchAI belongs to a workspace."
        title={title}
      />
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setWorkspaceName(event.target.value)}
          placeholder="Workspace name"
          value={workspaceName}
        />
        <Button disabled={creating || !workspaceName.trim()} type="submit" variant="primary">
          <Plus size={16} />
          Create Workspace
        </Button>
      </form>
    </div>
  );
}

function PageHeader({
  body,
  eyebrow,
  title
}: {
  body?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div>
      {eyebrow ? <p className="mb-2 text-sm font-semibold text-indigo-700">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold text-neutral-950">{title}</h1>
      {body ? <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{body}</p> : null}
    </div>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function EmptyState({
  body,
  compact = false,
  title
}: {
  body: string;
  compact?: boolean;
  title: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6", compact && "p-4")}>
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      {message}
    </div>
  );
}

function NavButton({
  active,
  badge,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  badge?: number;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md px-3 text-sm font-medium",
        active
          ? "bg-indigo-50 text-indigo-800"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-3">
        <Icon size={16} />
        {label}
      </span>
      {badge ? (
        <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MenuAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function IntegrationCard({
  body,
  icon,
  title
}: {
  body: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="text-indigo-700">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </div>
  );
}

function Avatar({ name, photoURL }: { name: string; photoURL?: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-indigo-50 text-sm font-semibold text-indigo-800">
      {photoURL ? (
        <img alt={name} className="h-full w-full object-cover" src={photoURL} />
      ) : (
        initials(name || "User")
      )}
    </span>
  );
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
