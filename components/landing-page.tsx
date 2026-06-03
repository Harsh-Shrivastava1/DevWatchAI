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
                {/* Central Diamond Logo */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center transform rotate-45 shadow-md animate-[spin_10s_linear_infinite_paused] hover:animate-[spin_10s_linear_infinite]">
                  {/* Reverse rotation for contents */}
                  <div className="-rotate-45 text-white flex items-center justify-center">
                    <Code2 size={20} className="stroke-[2.5]" />
                  </div>
                </div>
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
    <svg
      className="w-10 h-10"
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
