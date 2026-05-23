"use client";

import { useState, useEffect } from "react";
import { CloudIDE } from "@/components/cloud-ide";
import { LandingPage } from "@/components/landing-page";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AuthModal } from "@/components/auth-modal";
import type { AppView } from "@/lib/mock-data";
import { projects } from "@/lib/mock-data";

export interface UserSession {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  token?: string;
}

export function DevWatchApp() {
  const [view, setView] = useState<AppView>("landing");
  const [projectId, setProjectId] = useState(projects[0].id);
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialViewMode, setInitialViewMode] = useState<"signin" | "signup">("signin");

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("devwatch_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setView("overview");
      }
    } catch (e) {
      console.error("Failed to parse stored session", e);
    }
  }, []);

  function handleLoginSuccess(session: UserSession) {
    setUser(session);
    localStorage.setItem("devwatch_session", JSON.stringify(session));
    setAuthModalOpen(false);
    setView("overview");
  }

  function handleSignOut() {
    setUser(null);
    localStorage.removeItem("devwatch_session");
    setView("landing");
  }

  function openProject(id: string) {
    setProjectId(id);
    setView("ide");
  }

  function triggerLogin() {
    setInitialViewMode("signin");
    setAuthModalOpen(true);
  }

  function triggerSignup() {
    setInitialViewMode("signup");
    setAuthModalOpen(true);
  }

  if (view === "landing") {
    return (
      <>
        <LandingPage
          onEnter={triggerLogin}
          onExplore={triggerSignup}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  if (view === "ide") {
    return (
      <CloudIDE
        projectId={projectId}
        onBack={() => setView("projects")}
        onDashboard={() => setView("overview")}
      />
    );
  }

  return (
    <WorkspaceShell
      view={view}
      onViewChange={setView}
      onOpenProject={openProject}
      onHome={() => setView("landing")}
      user={user}
      onSignOut={handleSignOut}
    />
  );
}
