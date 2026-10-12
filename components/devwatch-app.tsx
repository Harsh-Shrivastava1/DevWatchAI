"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { CloudIDE } from "@/components/cloud-ide";
import { LandingPage } from "@/components/landing-page";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui";
import { apiData } from "@/lib/api";
import type { Member } from "@/lib/types";
import type { AppView, Project, UserSession } from "@/lib/types";

const SESSION_KEY = "devwatch_session";

export function DevWatchApp() {
  const [view, setView] = useState<AppView>("landing");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | undefined>();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    setInviteToken(new URLSearchParams(window.location.search).get("invite") || "");
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    try {
      const session = JSON.parse(stored) as UserSession;
      if (session?.token && session.email) {
        setUser(session);
        setView("overview");
        setOnboardingOpen(Boolean(session.onboardingRequired));
      }
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  async function respondToInvite(action: "accept" | "reject") {
    if (!user || !inviteToken) return;
    setInviteLoading(true);
    setInviteMessage(null);
    try {
      await apiData<Member>(`/api/invites/${inviteToken}/${action}`, {
        method: "POST",
        token: user.token
      });
      setInviteMessage(action === "accept" ? "Invitation accepted. Your workspace is ready." : "Invitation rejected.");
      setInviteToken("");
      window.history.replaceState({}, "", window.location.pathname);
      if (action === "accept") setView("overview");
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : "Could not process invitation.");
    } finally {
      setInviteLoading(false);
    }
  }

  function persistSession(session: UserSession) {
    setUser(session);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function handleAuthSuccess(session: UserSession) {
    persistSession(session);
    setAuthModalOpen(false);
    setView("overview");
    setOnboardingOpen(Boolean(session.onboardingRequired));
  }

  function handleOnboardingComplete(session: UserSession, project?: Project) {
    const nextSession = {
      ...session,
      onboardingRequired: false,
      onboardingCompleted: true
    };
    persistSession(nextSession);
    setOnboardingOpen(false);

    if (project) {
      openProject(project.id, project.projectName);
      return;
    }

    setView("overview");
  }

  function handleSignOut() {
    setUser(null);
    setProjectId(null);
    setProjectName(undefined);
    window.localStorage.removeItem(SESSION_KEY);
    setView("landing");
  }

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  function openProject(id: string, name?: string) {
    setProjectId(id);
    setProjectName(name);
    setView("ide");
  }

  if (!user || view === "landing") {
    return (
      <>
        {inviteToken ? (
          <div className="fixed inset-x-0 top-0 z-50 border-b border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-medium text-indigo-950">
            Sign in with the invited email address to accept or reject your DevWatchAI invitation.
          </div>
        ) : null}
        <LandingPage
          onEnter={() => openAuth("signin")}
          onExplore={() => openAuth("signup")}
        />
        <AuthModal
          initialMode={authMode}
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  if (view === "ide" && projectId) {
    return (
      <CloudIDE
        projectId={projectId}
        projectName={projectName}
        token={user.token}
        user={user}
        onBack={() => setView("projects")}
        onDashboard={() => setView("overview")}
      />
    );
  }

  return (
    <>
      {inviteToken ? (
        <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <span className="font-medium">You have been invited to a DevWatchAI workspace.</span>
          <Button disabled={inviteLoading} onClick={() => void respondToInvite("accept")} variant="primary">
            Accept
          </Button>
          <Button disabled={inviteLoading} onClick={() => void respondToInvite("reject")}>
            Reject
          </Button>
        </div>
      ) : inviteMessage ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white px-4 py-3 text-center text-sm text-neutral-800">
          {inviteMessage}
        </div>
      ) : null}
      <WorkspaceShell
        user={user}
        view={view}
        currentProjectId={projectId}
        onHome={() => setView("landing")}
        onOpenProject={openProject}
        onSignOut={handleSignOut}
        onViewChange={setView}
      />
      <OnboardingFlow
        isOpen={onboardingOpen}
        token={user.token}
        user={user}
        onComplete={handleOnboardingComplete}
        onClose={() => setOnboardingOpen(false)}
      />
    </>
  );
}
