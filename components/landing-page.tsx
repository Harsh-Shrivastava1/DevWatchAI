"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Code2,
  Database,
  MonitorDot,
  ShieldCheck,
  Users,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function LandingPage({
  onEnter,
  onExplore
}: {
  onEnter: () => void;
  onExplore: () => void;
}) {
  const [howToOpen, setHowToOpen] = useState(false);
  const features: Array<{
    title: string;
    icon: LucideIcon;
    description: string;
  }> = [
    {
      title: "Cloud IDE",
      icon: Code2,
      description: "Create and save files in MongoDB."
    },
    {
      title: "AI Review",
      icon: Bot,
      description: "Run Groq reviews and store results."
    },
    {
      title: "Team Chat",
      icon: Users,
      description: "Send project messages through the backend."
    },
    {
      title: "Monitoring",
      icon: MonitorDot,
      description: "Display real service records."
    },
    {
      title: "Analytics",
      icon: BarChart3,
      description: "Chart real project and review data."
    }
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-neutral-950">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
          <nav className="flex items-center justify-between py-5">
            <button className="flex items-center gap-3 text-left" onClick={onEnter}>
              <LogoMark />
              <span className="text-xl font-semibold text-neutral-950">
                DevWatch <span className="text-indigo-700">AI</span>
              </span>
            </button>
            <div className="flex items-center gap-3">
              <button
                className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={onEnter}
                type="button"
              >
                Log in
              </button>
              <button
                className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                onClick={onExplore}
                type="button"
              >
                Sign up
              </button>
            </div>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
            <div>
              <p className="mb-5 inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800">
                AI-powered cloud development workspace
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-neutral-950 sm:text-6xl">
                DevWatch AI
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                A collaborative browser IDE with Firebase authentication, MongoDB
                project storage, Groq-powered code review, monitoring, analytics,
                team chat, and ZIP export.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
                  onClick={onExplore}
                  type="button"
                >
                  Start Building
                  <ArrowRight size={16} />
                </button>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                  onClick={() => setHowToOpen(true)}
                  type="button"
                >
                  How To Use
                </button>
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <TrustItem icon={<ShieldCheck size={17} />} text="Firebase Auth" />
                <TrustItem icon={<Database size={17} />} text="MongoDB Atlas" />
                <TrustItem icon={<Bot size={17} />} text="Groq Llama 3.3" />
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-[#f7f8fb]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-semibold text-indigo-700">Product Surface</p>
            <h2 className="text-3xl font-semibold text-neutral-950">
              The platform opens directly into real work.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {features.map(({ title, icon: Icon, description }) => (
              <div key={title} className="rounded-lg border border-neutral-200 bg-white p-5">
                <Icon className="text-indigo-700" size={22} />
                <h3 className="mt-4 text-base font-semibold text-neutral-950">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">
              Ready to create your workspace?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Sign in, complete onboarding, create a workspace, and open the IDE.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800"
            onClick={onExplore}
            type="button"
          >
            Create Account
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {howToOpen ? <HowToModal onClose={() => setHowToOpen(false)} /> : null}
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-950 p-3 text-white">
      <div className="grid min-h-[520px] overflow-hidden rounded-md border border-white/10 bg-neutral-900 lg:grid-cols-[190px_minmax(0,1fr)_220px]">
        <aside className="border-r border-white/10 bg-neutral-950 p-4">
          <div className="mb-5 h-8 rounded bg-white/10" />
          {["Overview", "Projects", "AI Reviews", "Monitoring", "Team"].map((item) => (
            <div
              className="mb-2 rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300"
              key={item}
            >
              {item}
            </div>
          ))}
        </aside>
        <section className="min-w-0 p-4">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-sm font-semibold">/src/app.tsx</p>
              <p className="text-xs text-neutral-400">MongoDB synced file</p>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200">
              Saved
            </span>
          </div>
          <pre className="overflow-hidden rounded-md bg-black/40 p-4 text-xs leading-6 text-neutral-300">
            <code>{`export function Workspace() {
  return (
    <CloudIDE
      aiProvider="groq"
      storage="mongodb"
    />
  );
}`}</code>
          </pre>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Projects", "Reviews", "Members"].map((label) => (
              <div className="rounded-md border border-white/10 p-3" key={label}>
                <p className="text-xs text-neutral-400">{label}</p>
                <div className="mt-3 h-2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </section>
        <aside className="border-l border-white/10 bg-neutral-950 p-4">
          <p className="text-sm font-semibold">AI Review</p>
          <div className="mt-4 space-y-3">
            {["Structured JSON", "Security issues", "Auto-fix plan"].map((item) => (
              <div className="rounded-md border border-white/10 p-3 text-sm text-neutral-300" key={item}>
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function HowToModal({ onClose }: { onClose: () => void }) {
  const steps = [
    "Sign in with Firebase email/password or Google.",
    "Complete onboarding and create a workspace.",
    "Create a project, then open it in the Cloud IDE.",
    "Create files, save edits, send team chat messages, and run AI review.",
    "Use dashboard pages for real activity, reviews, monitoring, deployments, notifications, and analytics.",
    "Export the project ZIP when you want to move it outside DevWatch AI."
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Guide</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
              How To Use DevWatch AI
            </h2>
          </div>
          <button
            aria-label="Close guide"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li className="flex gap-3 text-sm leading-6 text-neutral-700" key={step}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-sm font-semibold text-indigo-800">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700">
      <span className="text-indigo-700">{icon}</span>
      {text}
    </div>
  );
}

function LogoMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-700 text-sm font-semibold text-white">
      DW
    </span>
  );
}
