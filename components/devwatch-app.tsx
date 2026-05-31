"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { CloudIDE } from "@/components/cloud-ide";
import { LandingPage } from "@/components/landing-page";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { WorkspaceShell } from "@/components/workspace-shell";
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

  useEffect(() => {
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
      <WorkspaceShell
        user={user}
        view={view === "ide" ? "overview" : view}
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
