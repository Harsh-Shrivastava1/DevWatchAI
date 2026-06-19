"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  MonitorDot,
  Play,
  Search,
  ShieldCheck,
  Users,
  Wand2,
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
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
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
                Build smarter with an AI-powered collaborative workspace for coding, code reviews, real-time teamwork, monitoring, and deployment all in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors"
                  onClick={onExplore}
                  type="button"
                >
                  Start Building
                  <ArrowRight size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <button
                    className="relative inline-flex h-11 items-center gap-2 rounded-md border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-all hover:border-indigo-300 hover:shadow-sm"
                    onClick={() => setHowToOpen(true)}
                    type="button"
                  >
                    How To Use
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-indigo-500"></span>
                    </span>
                  </button>
                  <span className="hidden sm:inline-flex items-center text-sm font-medium text-indigo-600 animate-pulse">
                    ← Start here!
                  </span>
                </div>
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-[#f7f8fb]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-10 flex flex-col gap-3">
            <p className="inline-flex w-fit items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Product Surface
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              The platform opens directly into real work.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {features.map(({ title, icon: Icon, description }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100/50 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon size={22} />
                </div>
                <h3 className="relative z-10 mt-5 text-base font-semibold text-neutral-950">
                  {title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-6 text-neutral-600">
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

      {howToOpen ? (
        <HowToModal
          onClose={() => setHowToOpen(false)}
          onStart={() => {
            setHowToOpen(false);
            onExplore();
          }}
        />
      ) : null}

      {privacyOpen ? (
        <PrivacyModal onClose={() => setPrivacyOpen(false)} />
      ) : null}

      {termsOpen ? (
        <TermsModal onClose={() => setTermsOpen(false)} />
      ) : null}

      {contactOpen ? (
        <ContactModal onClose={() => setContactOpen(false)} />
      ) : null}

      <footer className="border-t border-neutral-200 bg-white py-8 text-center text-sm text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-5 sm:flex-row sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} DevWatch AI. Developed by Harsh Shrivastava.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setPrivacyOpen(true)} className="hover:text-neutral-900 transition-colors">Privacy Policy</button>
            <button onClick={() => setTermsOpen(true)} className="hover:text-neutral-900 transition-colors">Terms of Service</button>
            <button onClick={() => setContactOpen(true)} className="hover:text-neutral-900 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative w-full min-h-[480px] lg:min-h-[520px] flex items-center justify-center overflow-visible">
      {/* Central Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-gradient-to-tr from-blue-600/5 to-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Connection Lines (Desktop only) */}
      <svg
        className="absolute inset-0 hidden md:block w-full h-full pointer-events-none"
        viewBox="0 0 600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
          </marker>
        </defs>

        {/* Connection paths exactly like the reference image */}
        {/* 1. Center to right edge of AI Code Review */}
        <path
          d="M 280 185 C 280 150, 270 130, 248 130"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
          opacity="0.6"
        />

        {/* 2. Above Team Collaboration to bottom of AI Code Review */}
        <path
          d="M 140 280 C 100 280, 70 240, 70 140"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
          opacity="0.6"
        />

        {/* 3. Center to bottom of Real-time Monitoring */}
        <path
          d="M 320 285 C 360 285, 390 270, 390 210"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
          opacity="0.6"
        />

        {/* 4. Below Team Collaboration to left of Advanced Analytics */}
        <path
          d="M 200 405 C 200 430, 250 430, 338 430"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
          opacity="0.6"
        />
      </svg>

      {/* Floating Layout for Desktop / Grid for Mobile */}
      <div className="relative z-10 w-full h-full min-h-[480px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:block gap-4 w-full h-full min-h-[480px]">

          {/* Card 1: AI Code Review (Top-Left) */}
          <div className="md:absolute md:top-[6%] md:left-[2%] md:w-[230px] bg-white rounded-2xl border border-neutral-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)] transition-all duration-300">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Code2 size={22} />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-neutral-950">AI Code Review</h4>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
                  Find bugs, improve quality, and get intelligent suggestions in seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Real-time Monitoring (Top-Right) */}
          <div className="md:absolute md:top-[20%] md:right-[2%] md:w-[230px] bg-white rounded-2xl border border-neutral-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)] transition-all duration-300">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MonitorDot size={22} />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-neutral-950">Real-time Monitoring</h4>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
                  Monitor your infrastructure and services 24/7 with smart alerts and insights.
                </p>
              </div>
            </div>
          </div>

          {/* Center Logo Badge (Desktop only) */}
          <div className="hidden md:flex md:absolute md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 items-center justify-center z-20 pointer-events-none">
            {/* Outer soft glow ring */}
            <div className="absolute w-36 h-36 rounded-full bg-indigo-50/50 animate-pulse" />
            {/* Outer border container */}
            <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-150/40">
              {/* Inner ring */}
              <div className="w-20 h-20 rounded-full bg-indigo-50/30 flex items-center justify-center">
                {/* Central Logo */}
                <LogoMark className="w-16 h-16 animate-[spin_10s_linear_infinite_paused] hover:animate-[spin_10s_linear_infinite]" />
              </div>
            </div>
          </div>

          {/* Card 3: Team Collaboration (Bottom-Left) */}
          <div className="md:absolute md:bottom-[20%] md:left-[4%] md:w-[230px] bg-white rounded-2xl border border-neutral-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)] transition-all duration-300">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Users size={22} />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-neutral-950">Team Collaboration</h4>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
                  Collaborate in real time with chat, comments, and shared workspaces.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Advanced Analytics (Bottom-Right) */}
          <div className="md:absolute md:bottom-[6%] md:right-[6%] md:w-[230px] bg-white rounded-2xl border border-neutral-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(59,130,246,0.08)] transition-all duration-300">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <BarChart3 size={22} />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-neutral-950">Advanced Analytics</h4>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
                  Track performance, productivity and deployment metrics in beautiful dashboards.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

type GuideSection = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  steps: Array<{
    title: string;
    body: string;
    tip?: string;
  }>;
};

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Create your account and enter DevWatch AI",
    shortTitle: "Getting Started",
    description: "Your account gives you secure access to every workspace and project you belong to.",
    icon: KeyRound,
    steps: [
      {
        title: "Choose Log in or Sign up",
        body: "Use email and password or continue with Google. New users should choose Sign up; returning users should choose Log in."
      },
      {
        title: "Verify and recover your account",
        body: "Verify your email when requested. If you forget your password, use Forgot password on the login form and follow the reset email."
      },
      {
        title: "Complete onboarding",
        body: "Enter your profile details and create your first workspace. After onboarding, DevWatch AI opens your workspace dashboard.",
        tip: "Use the same email address that received a workspace invitation."
      }
    ]
  },
  {
    id: "workspace",
    title: "Understand workspaces, projects, and roles",
    shortTitle: "Workspace Basics",
    description: "A workspace contains your team, projects, activity, reviews, deployments, and monitoring data.",
    icon: LayoutDashboard,
    steps: [
      {
        title: "Create or switch workspaces",
        body: "Use the workspace selector in the dashboard header to move between teams. Use New → New Workspace to create another workspace."
      },
      {
        title: "Know what each role can do",
        body: "Owners control the workspace. Admins manage projects and members. Developers can build and collaborate. Viewers can inspect work without changing it."
      },
      {
        title: "Use the dashboard",
        body: "Overview summarizes activity. Projects opens your code. AI Code Review stores Groq results. Deployments, Monitoring, Alerts, Analytics, and Members show live workspace data."
      }
    ]
  },
  {
    id: "project",
    title: "Create a project and organize its files",
    shortTitle: "Projects & Files",
    description: "Projects store their complete folder tree and file contents in MongoDB.",
    icon: FolderTree,
    steps: [
      {
        title: "Create and open a project",
        body: "Open Projects, enter a name and description, then choose Create Project. The new project opens directly in the Cloud IDE."
      },
      {
        title: "Create files and folders",
        body: "Use New File in the toolbar or the file explorer actions. Right-click inside the explorer to create, rename, duplicate, move, or delete entries."
      },
      {
        title: "Import code from your computer",
        body: "Choose Import Files for one or many files, or use the folder import action in the explorer. DevWatch AI preserves supported folder structures and handles duplicate names safely.",
        tip: "Supported imports include JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, HTML, CSS, JSON, Markdown, YAML, text, and .env files."
      }
    ]
  },
  {
    id: "editor",
    title: "Write, save, and recover code",
    shortTitle: "Cloud IDE",
    description: "The editor combines Monaco editing, persistent storage, version history, and conflict protection.",
    icon: FileCode2,
    steps: [
      {
        title: "Open and edit files",
        body: "Select a file in the explorer to open it in a tab. DevWatch AI detects its language and provides syntax highlighting through the Monaco editor."
      },
      {
        title: "Save confidently",
        body: "Edits auto-save after a short delay. Choose Save for an immediate manual save. The project remembers your files when you reload.",
        tip: "If two people save the same file at once, the conflict dialog lets you keep your version or use the latest server version."
      },
      {
        title: "Restore an earlier version",
        body: "Open History in the right panel, inspect saved versions, and restore the version you need. Saves, renames, imports, deletes, and AI fixes are recorded."
      }
    ]
  },
  {
    id: "collaboration",
    title: "Invite teammates and collaborate live",
    shortTitle: "Collaboration",
    description: "Work together inside the same project with live presence, synchronized edits, and persistent chat.",
    icon: Users,
    steps: [
      {
        title: "Invite a teammate",
        body: "Choose Invite in the IDE or open Members from the dashboard. Enter the teammate’s email and role. They must sign in with that email before accepting the secure invitation."
      },
      {
        title: "See who is working",
        body: "The IDE header shows online collaborators. Presence details include their current file, cursor location, editing state, and last activity."
      },
      {
        title: "Use project chat",
        body: "Open Chat in the right panel to send messages, code blocks, file references, and emoji. Messages, typing indicators, online state, history, and read receipts update in real time.",
        tip: "Live edits and file-tree changes are shared automatically with everyone in the project."
      }
    ]
  },
  {
    id: "ai",
    title: "Review and improve code with Groq AI",
    shortTitle: "AI Tools",
    description: "Groq analyzes real project code and stores structured results with your project.",
    icon: Wand2,
    steps: [
      {
        title: "Run a file review",
        body: "Open a file and choose AI Review. Review the score, findings, severity, affected lines, and suggested next actions in the AI panel."
      },
      {
        title: "Analyze the whole project",
        body: "Use project analysis for architecture, security, performance, maintainability, complexity, quality scores, bug counts, and prioritized suggestions."
      },
      {
        title: "Apply an AI fix safely",
        body: "Ask AI to generate a fix, inspect its explanation and proposed code, then explicitly choose Apply. DevWatch AI records the change in version history.",
        tip: "AI fixes never apply automatically; you remain in control of every code change."
      }
    ]
  },
  {
    id: "run-deploy",
    title: "Run, troubleshoot, deploy, and monitor",
    shortTitle: "Run & Deploy",
    description: "Test your project, inspect exact failures, create deployment artifacts, and follow stored health metrics.",
    icon: Play,
    steps: [
      {
        title: "Run your project",
        body: "Choose Run in the IDE. The Console panel streams stdout, stderr, execution status, runtime, and duration. Use Stop or Restart while a process is active."
      },
      {
        title: "Fix runtime errors",
        body: "When execution fails, inspect the stack trace and affected location. Ask Groq to explain the error and generate a focused fix, then review it before applying."
      },
      {
        title: "Deploy and monitor",
        body: "Choose Deploy to validate the project, run checks, generate a deploy artifact, and store progress and logs. Monitoring shows CPU, memory, latency, uptime, sessions, errors, builds, deployment status, and AI usage."
      }
    ]
  },
  {
    id: "find-export",
    title: "Find work, export projects, and stay safe",
    shortTitle: "Search & Export",
    description: "Use the platform’s search and export tools to move quickly and retain full ownership of your code.",
    icon: Search,
    steps: [
      {
        title: "Search across your workspace",
        body: "Use the dashboard search field to find projects, file names, folder names, and matching code content."
      },
      {
        title: "Export your project",
        body: "Choose Export ZIP in the IDE to download the complete project structure. You can open it locally, upload it to GitHub, or deploy it elsewhere."
      },
      {
        title: "Handle common problems",
        body: "If data does not load, confirm your connection and retry. If access is denied, ask a workspace owner to check your role. If an invitation fails, sign in with the exact invited email.",
        tip: "Your code, chat, reviews, versions, monitoring records, and deployment history remain attached to the workspace."
      }
    ]
  }
];

function HowToModal({
  onClose,
  onStart
}: {
  onClose: () => void;
  onStart: () => void;
}) {
  const [activeId, setActiveId] = useState(guideSections[0].id);
  const activeSection =
    guideSections.find((section) => section.id === activeId) || guideSections[0];
  const activeIndex = guideSections.findIndex((section) => section.id === activeSection.id);
  const ActiveIcon = activeSection.icon;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && activeIndex < guideSections.length - 1) {
        setActiveId(guideSections[activeIndex + 1].id);
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        setActiveId(guideSections[activeIndex - 1].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/65 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <div
        aria-labelledby="devwatch-guide-title"
        aria-modal="true"
        className="flex max-h-[calc(100vh-24px)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white sm:max-h-[calc(100vh-40px)]"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-sm font-semibold text-indigo-700">DevWatch AI User Guide</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-950 sm:text-2xl" id="devwatch-guide-title">
              Build, collaborate, review, and deploy with confidence
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
              Follow this guide from account creation to exporting a finished project.
            </p>
          </div>
          <button
            aria-label="Close guide"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[245px_minmax(0,1fr)]">
          <aside className="border-b border-neutral-200 bg-neutral-50 p-3 md:overflow-y-auto md:border-b-0 md:border-r">
            <div className="flex gap-2 overflow-x-auto md:block md:space-y-1">
              {guideSections.map((section, index) => {
                const Icon = section.icon;
                const active = section.id === activeSection.id;
                return (
                  <button
                    aria-current={active ? "step" : undefined}
                    className={`flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium md:w-full md:min-w-0 ${active
                      ? "bg-indigo-700 text-white"
                      : "text-neutral-700 hover:bg-white hover:text-neutral-950"
                      }`}
                    key={section.id}
                    onClick={() => setActiveId(section.id)}
                    type="button"
                  >
                    <span className="truncate">
                      <span className={`mr-1.5 text-xs ${active ? "text-indigo-100" : "text-neutral-400"}`}>
                        {index + 1}.
                      </span>
                      {section.shortTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-3xl p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                  <ActiveIcon size={21} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase text-indigo-700">
                    Step {activeIndex + 1} of {guideSections.length}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-neutral-950">
                    {activeSection.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {activeSection.description}
                  </p>
                </div>
              </div>

              <ol className="mt-7 space-y-3">
                {activeSection.steps.map((step, index) => (
                  <li className="rounded-lg border border-neutral-200 p-4 sm:p-5" key={step.title}>
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-semibold text-neutral-700">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-950">{step.title}</h4>
                        <p className="mt-1.5 text-sm leading-6 text-neutral-600">{step.body}</p>
                        {step.tip ? (
                          <div className="mt-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-900">
                            <Lightbulb className="mt-0.5 shrink-0" size={15} />
                            <span>{step.tip}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      {activeIndex === guideSections.length - 1
                        ? "You are ready to build in DevWatch AI."
                        : "Complete these actions, then continue to the next section."}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-emerald-800">
                      Everything you create is saved to your workspace and restored when you return.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-xs text-neutral-500">
            Need this later? Open <span className="font-medium text-neutral-700">How To Use</span> from the login page.
          </p>
          <div className="flex items-center gap-2">
            {activeIndex > 0 ? (
              <button
                className="h-9 rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => setActiveId(guideSections[activeIndex - 1].id)}
                type="button"
              >
                Previous
              </button>
            ) : null}
            {activeIndex < guideSections.length - 1 ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white hover:bg-indigo-800"
                onClick={() => setActiveId(guideSections[activeIndex + 1].id)}
                type="button"
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white hover:bg-indigo-800"
                onClick={onStart}
                type="button"
              >
                Create Account
                <ArrowRight size={14} />
              </button>
            )}
          </div>
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

function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-outline-grad" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#logo-outline-grad)"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <path
        d="M 39 42 L 31 50 L 39 58"
        stroke="url(#logo-outline-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 47 36 L 53 64"
        stroke="url(#logo-outline-grad)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 61 42 L 69 50 L 61 58"
        stroke="url(#logo-outline-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/65 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white sm:max-h-[calc(100vh-40px)]"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950 sm:text-2xl">Privacy Policy</h2>
          </div>
          <button
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-8 text-sm leading-6 text-neutral-600">
          <p className="mb-4">
            Welcome to DevWatch AI. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">1. Information We Collect</h3>
          <p className="mb-4">
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">2. How We Use Your Information</h3>
          <p className="mb-4">
            We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">3. Will Your Information Be Shared With Anyone?</h3>
          <p className="mb-4">
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-3 sm:px-6">
          <button
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/65 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white sm:max-h-[calc(100vh-40px)]"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950 sm:text-2xl">Terms of Service</h2>
          </div>
          <button
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-8 text-sm leading-6 text-neutral-600">

          <p className="mb-4">
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and DevWatch AI ("Company", "we", "us", or "our"), concerning your access to and use of our platform.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">1. Agreement to Terms</h3>
          <p className="mb-4">
            By accessing the Services, you agree that you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">2. User Representations</h3>
          <p className="mb-4">
            By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.
          </p>
          <h3 className="mt-6 mb-2 text-base font-semibold text-neutral-950">3. Prohibited Activities</h3>
          <p className="mb-4">
            You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-3 sm:px-6">
          <button
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/65 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[calc(100vh-24px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white sm:max-h-[calc(100vh-40px)]"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-xl font-semibold text-neutral-950 sm:text-2xl">Contact Us</h2>
          </div>
          <button
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-8 text-sm leading-6 text-neutral-600">
          <p className="mb-4">
            We would love to hear from you! Whether you have a question about features or anything else, our team is ready to answer all your questions.
          </p>
          <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
            <h3 className="mb-2 text-base font-semibold text-neutral-950">Email Support</h3>
            <p className="mb-4">
              For any inquiries, technical support, or feedback, please reach out directly via email. We aim to respond to all inquiries within 24-48 hours.
            </p>
            <a
              href="mailto:hshrivastava23032007@gmail.com"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors"
            >
              hshrivastava23032007@gmail.com
            </a>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-3 sm:px-6">
          <button
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
