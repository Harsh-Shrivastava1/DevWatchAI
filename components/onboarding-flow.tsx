"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Code2,
  Loader2,
  Rocket,
  Users,
  X
} from "lucide-react";
import { apiData, apiFetch } from "@/lib/api";
import type { ApiResponse, Project, UserSession, Workspace } from "@/lib/types";

const steps = [
  {
    title: "Create your workspace",
    description: "Workspaces hold teams, projects, files, chat, reviews, and alerts.",
    icon: Users
  },
  {
    title: "Add your first project",
    description: "Projects open in the browser IDE and sync files to MongoDB.",
    icon: Code2
  },
  {
    title: "Review with Groq",
    description: "AI reviews return structured JSON and are stored with the project.",
    icon: Bot
  },
  {
    title: "Invite collaborators",
    description: "Team roles keep owners, admins, developers, and viewers separated.",
    icon: Users
  },
  {
    title: "Monitor and analyze",
    description: "Monitoring, deployments, reviews, and activity appear when real records exist.",
    icon: Rocket
  },
  {
    title: "Export anytime",
    description: "Projects can be downloaded as a ZIP from the IDE.",
    icon: Code2
  },
  {
    title: "Finish setup",
    description: "Save this onboarding state and enter the workspace.",
    icon: Check
  }
];

interface OnboardingFlowProps {
  isOpen: boolean;
  token: string;
  user: UserSession;
  onClose: () => void;
  onComplete: (session: UserSession, project?: Project) => void;
}

export function OnboardingFlow({
  isOpen,
  token,
  user,
  onClose,
  onComplete
}: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = steps[step];
  const Icon = current.icon;
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  if (!isOpen) return null;

  async function finish() {
    setSaving(true);
    setError(null);

    try {
      let workspace: Workspace | null = null;
      let project: Project | undefined;

      if (workspaceName.trim()) {
        workspace = await apiData<Workspace>("/api/workspaces", {
          method: "POST",
          token,
          body: { workspaceName: workspaceName.trim() }
        });
      }

      if (workspace && projectName.trim()) {
        project = await apiData<Project>("/api/projects", {
          method: "POST",
          token,
          body: {
            workspaceId: workspace.id,
            projectName: projectName.trim()
          }
        });
      }

      const response = await apiFetch<ApiResponse<never>>(
        "/api/auth/onboarding/complete",
        {
          method: "POST",
          token
        }
      );

      onComplete(
        {
          ...user,
          name: response.user?.name || user.name,
          onboardingRequired: false,
          onboardingCompleted: true
        },
        project
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Onboarding could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Setup</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
              {current.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
              {current.description}
            </p>
          </div>
          <button
            aria-label="Close onboarding"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-indigo-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="flex h-32 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-indigo-700">
            <Icon size={42} />
          </div>

          <div className="space-y-5">
            {step === 0 ? (
              <InputBlock
                label="Workspace name"
                onChange={setWorkspaceName}
                placeholder="CodedWaves"
                value={workspaceName}
              />
            ) : null}
            {step === 1 ? (
              <InputBlock
                label="Project name"
                onChange={setProjectName}
                placeholder="Frontend App"
                value={projectName}
              />
            ) : null}
            {step > 1 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                {step === 2
                  ? "Use the IDE AI panel to run a Groq review, bug scan, project analysis, or assistant question against real project code."
                  : step === 3
                    ? "Invite flows can be connected to email delivery next; the database already stores member roles and invitation state."
                    : step === 4
                      ? "Dashboards stay empty until real monitoring, deployment, review, notification, and activity records are created."
                      : step === 5
                        ? "The export action streams a ZIP from the backend using files saved in MongoDB."
                        : "Complete onboarding now. You can create a workspace later from the dashboard if you skipped setup."}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-6">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            disabled={step === 0 || saving}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            type="button"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step === steps.length - 1 ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:bg-neutral-400"
              disabled={saving}
              onClick={finish}
              type="button"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Finish
            </button>
          ) : (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800"
              onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
              type="button"
            >
              Next
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputBlock({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
