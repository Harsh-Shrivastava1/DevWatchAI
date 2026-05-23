"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Code2,
  Gift,
  Github,
  Linkedin,
  MonitorDot,
  Play,
  RotateCw,
  ShieldCheck,
  Twitter,
  Users,
  X,
  Check
} from "lucide-react";

export function LandingPage({
  onEnter,
  onExplore
}: {
  onEnter: () => void;
  onExplore: () => void;
}) {
  const [activeFooterItem, setActiveFooterItem] = useState<string | null>(null);

  const footerContent: Record<string, { title: string; desc: string; details: string[] }> = {
    "Features": {
      title: "DevWatch AI Features",
      desc: "Explore DevWatch AI's premium developer toolbox.",
      details: [
        "Real-time AI-powered code analysis and refactoring tips",
        "Automated pull request reviews with Groq LLM",
        "Pipeline build logs streaming & terminal console simulation",
        "Live service monitoring and CPU/RAM/latency status tracking",
        "Multi-tab workspace configuration and team management settings"
      ]
    },
    "Integrations": {
      title: "Third-party Integrations",
      desc: "Connect your workspace with major development utilities.",
      details: [
        "GitHub & GitLab webhook events synchronization",
        "Firebase Web Auth & Admin Client SDK integration",
        "Groq LLM API connectivity for code reviews",
        "Slack webhook notifications and real-time alerts",
        "SSO and JWT-based session security protocols"
      ]
    },
    "Changelog": {
      title: "Changelog (v2.3.0)",
      desc: "Latest changes and product updates for DevWatch AI.",
      details: [
        "Height-constrained dashboard layout with independent scrolling elements",
        "Firebase Client Auth integration (Google OAuth popup & email verification)",
        "Robust backend API authentication with Zod payload deserialization",
        "Tabbed settings view (Profile, Accounts, Notifications, Theme)",
        "Optimized Next.js Turbopack build configuration"
      ]
    },
    "Pricing": {
      title: "Flexible Pricing Plans",
      desc: "Choose the perfect scale for your developer workflow.",
      details: [
        "Free Tier: 3 projects, basic reviews, and public repositories (Free)",
        "Pro Tier: Unlimited projects, deep AI reviews, and shared workrooms ($15/mo)",
        "Enterprise Tier: Self-hosted instance, dedicated support, and custom SLAs"
      ]
    },
    "Dev Teams": {
      title: "Solutions for Dev Teams",
      desc: "Empower your engineering squads to collaborate efficiently.",
      details: [
        "Shared project workspaces and active developer directories",
        "Real-time online indicators and peer commit streaming",
        "Centralized logs and build status views for unified debugging",
        "Instant peer code alerts and notifications"
      ]
    },
    "Startups": {
      title: "Solutions for Startups",
      desc: "Build fast, minimize code debt, and ship confidently.",
      details: [
        "Automated auditing for quick onboarding of new developers",
        "AI-assisted pull request signoffs to accelerate release cycles",
        "Flexible mock databases and quick deployment console setup",
        "Zero-config monitoring for early-stage web servers"
      ]
    },
    "Enterprises": {
      title: "Solutions for Enterprises",
      desc: "Highly secure, scalable, and customizable deployment options.",
      details: [
        "SAML SSO & OAuth team membership providers",
        "Dedicated isolated database nodes with MongoDB configurations",
        "Custom service accounts and Firebase Admin certifications",
        "Enterprise-grade service level agreements and support channels"
      ]
    },
    "Remote Teams": {
      title: "Solutions for Remote Teams",
      desc: "Keep distributed developers aligned and coding in sync.",
      details: [
        "Real-time chat feed (#general and custom channels) on the dashboard",
        "Activity feed showing live commits, deployments, and requests",
        "Dynamic browser-based IDE workspace for collaborative writing",
        "Global service metrics accessible anywhere"
      ]
    },
    "Docs": {
      title: "Documentation & Guides",
      desc: "Everything you need to set up, build, and deploy DevWatch AI.",
      details: [
        "Getting Started: Setting up environment variable values",
        "Client Guide: Customizing sidebar tabs and dashboard sections",
        "Server Integration: Connecting MongoDB and Firebase endpoints",
        "AI customization: Tweaking system prompt templates"
      ]
    },
    "Blog": {
      title: "DevWatch AI Blog",
      desc: "Read our latest articles on software engineering and design.",
      details: [
        "Unlocking developer productivity with agentic AI workflows",
        "Why scroll layout and UX structure define premium SaaS products",
        "Building scalable web applications with Next.js Turbopack and React",
        "Demystifying Firebase auth setups for modern SaaS platforms"
      ]
    },
    "Help Center": {
      title: "Help Center & Support",
      desc: "Get round-the-clock help from our team of developer advocates.",
      details: [
        "FAQ database answering common setup and variable configuration questions",
        "Contact support team directly at support@devwatch.ai",
        "SLA status checks and incident report dashboard",
        "Open-source community forums for custom features discussions"
      ]
    },
    "Status": {
      title: "System Status Page",
      desc: "Real-time updates on all DevWatch AI core infrastructure.",
      details: [
        "Web App Server: 100% Operational (Green)",
        "Backend Express API: Active & Healthy (Green)",
        "Database (MongoDB Cluster): Connected (Green)",
        "Firebase Auth services: Operational (Green)",
        "Groq LLM AI Inference: Normal Latency (Green)"
      ]
    },
    "About Us": {
      title: "About DevWatch AI",
      desc: "Learn about the mission and team behind the platform.",
      details: [
        "Crafted by passionate remote engineers and web design specialists",
        "Committed to building the ultimate pair-programming companion",
        "Headquartered in San Francisco with remote hubs globally",
        "Backed by major web standards advocates and developer communities"
      ]
    },
    "Careers": {
      title: "Careers at DevWatch AI",
      desc: "We are actively hiring remote-first talent to join our team.",
      details: [
        "Senior Frontend Engineer (React/TypeScript/Tailwind)",
        "Senior Backend Systems Developer (Node.js/Express/MongoDB)",
        "Product Designer (UI/UX specialist)",
        "Developer Relations Manager (Community/Docs writer)"
      ]
    },
    "Contact": {
      title: "Contact DevWatch AI",
      desc: "Get in touch with our team for general inquiries or support.",
      details: [
        "Email inquiries: info@devwatch.ai or contact@devwatch.ai",
        "Phone support: +1 (555) 019-2834 (9 AM - 5 PM PST)",
        "Main Office: 100 Pine Street, San Francisco, CA 94111",
        "Support room: Live support chat channel inside workspace shell"
      ]
    },
    "Privacy Policy": {
      title: "Privacy Policy",
      desc: "Your data security and code ownership is our top priority.",
      details: [
        "No private codebase files are uploaded, stored, or indexed without consent",
        "API credential keys are strictly handled inside local environment variables",
        "Session tokens are signed with JWT and encrypted during client transfer",
        "We comply with standard global regulations on user data privacy"
      ]
    }
  };
  return (
    <main className="min-h-screen bg-[#fafbfe] text-neutral-900 antialiased overflow-x-hidden">
      {/* Hero Section Container */}
      <section className="workspace-grid relative border-b border-neutral-100 bg-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,247,255,0.85)_40%,rgba(238,242,255,0.7))] pointer-events-none" />
        
        <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8">
          {/* Nav Header */}
          <nav className="flex items-center justify-between py-4">
            <button
              className="flex items-center gap-3 rounded-md text-left transition hover:opacity-90 focus:outline-none"
              onClick={onEnter}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/10">
                <svg className="h-6 w-6 text-white" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
                  <path d="M16 15L11 20L16 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24 15L29 20L24 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>
                <span className="text-xl font-bold tracking-tight text-neutral-900">
                  DevWatch <span className="text-indigo-600 font-semibold">AI</span>
                </span>
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onEnter}
                className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300"
              >
                Log in
              </button>
              <button
                onClick={onEnter}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 shadow-indigo-600/10 hover:shadow-lg"
              >
                Sign up
              </button>
            </div>
          </nav>

          {/* Hero Section Grid */}
          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-12">
            {/* Hero Left content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 flex flex-col items-start"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                <span className="text-indigo-400 font-bold">+</span> AI-Powered Development Platform
              </div>
              
              <h1 className="text-[44px] font-extrabold tracking-tight text-neutral-900 sm:text-6xl md:text-7xl leading-[1.08]">
                Build better. <br />
                Ship faster. <br />
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Monitor smarter.
                </span>
              </h1>
              
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-500">
                DevWatch AI helps development teams review code, monitor systems, and collaborate in real time — all in one powerful platform.
              </p>
              
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  onClick={onEnter}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-indigo-700/30"
                >
                  Sign up for free
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={onExplore}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-indigo-600/30 text-indigo-600 transition hover:border-indigo-600 hover:bg-indigo-50">
                    <Play size={10} fill="currentColor" className="ml-0.5" />
                  </span>
                  Watch features
                </button>
              </div>

              {/* Benefit List */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <ShieldCheck size={18} className="text-indigo-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Gift size={18} className="text-indigo-500" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <RotateCw size={17} className="text-indigo-500 animate-spin-slow" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="lg:col-span-6 relative flex items-center justify-center min-h-[500px]"
            >
              {/* Graphic visible on desktop sizes */}
              <div className="relative w-full h-[520px] max-w-[550px] mx-auto hidden sm:block">
                {/* SVG connection lines with arrow heads */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-200" viewBox="0 0 550 520" fill="none">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="currentColor" />
                    </marker>
                  </defs>
                  
                  {/* Curve 1: Top-Left to Center */}
                  <path d="M 220 115 C 265 115, 275 160, 275 195" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" markerEnd="url(#arrow)" />
                  {/* Curve 2: Center to Top-Right */}
                  <path d="M 330 245 C 380 245, 380 180, 420 180" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" markerEnd="url(#arrow)" />
                  {/* Curve 3: Center to Bottom-Left */}
                  <path d="M 275 315 C 275 360, 240 380, 220 380" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" markerEnd="url(#arrow)" />
                  {/* Curve 4: Center to Bottom-Right */}
                  <path d="M 325 275 C 380 275, 385 330, 420 330" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" markerEnd="url(#arrow)" />
                </svg>

                {/* Center glowing circle */}
                <div className="absolute top-[200px] left-[215px] z-10 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white shadow-[0_20px_50px_rgba(99,102,241,0.15)] border border-neutral-100">
                  <div className="absolute inset-2.5 rounded-full border border-dashed border-indigo-200/80 animate-spin-slow" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/50">
                    <svg className="h-9 w-9 text-indigo-600 animate-pulse" viewBox="0 0 40 40" fill="none">
                      <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
                      <path d="M16 15L11 20L16 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 15L29 20L24 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Floating Card 1: Top-Left (AI Code Review) */}
                <div className="absolute top-[30px] left-0 w-[245px] flex items-start gap-4 rounded-2xl border border-neutral-100/80 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">AI Code Review</h4>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed font-medium">Find bugs, improve quality, and get intelligent suggestions in seconds.</p>
                  </div>
                </div>

                {/* Floating Card 2: Top-Right (Real-time Monitoring) */}
                <div className="absolute top-[100px] right-0 w-[245px] flex items-start gap-4 rounded-2xl border border-neutral-100/80 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MonitorDot size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Real-time Monitoring</h4>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed font-medium">Monitor your infrastructure and services 24/7 with smart alerts and insights.</p>
                  </div>
                </div>

                {/* Floating Card 3: Bottom-Left (Team Collaboration) */}
                <div className="absolute bottom-[40px] left-[10px] w-[245px] flex items-start gap-4 rounded-2xl border border-neutral-100/80 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50/70 text-indigo-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Team Collaboration</h4>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed font-medium">Collaborate in real time with chat, comments, and shared workspaces.</p>
                  </div>
                </div>

                {/* Floating Card 4: Bottom-Right (Advanced Analytics) */}
                <div className="absolute bottom-[90px] right-0 w-[245px] flex items-start gap-4 rounded-2xl border border-neutral-100/80 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(14,165,233,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Advanced Analytics</h4>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed font-medium">Track performance, productivity and deployment metrics in beautiful dashboards.</p>
                  </div>
                </div>
              </div>

              {/* Responsive Layout for Mobile Screens */}
              <div className="grid grid-cols-1 gap-4 sm:hidden w-full px-2">
                <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">AI Code Review</h4>
                    <p className="mt-1 text-xs text-neutral-500">Find bugs, improve quality, and get suggestions in seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MonitorDot size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Real-time Monitoring</h4>
                    <p className="mt-1 text-xs text-neutral-500">Monitor infrastructure 24/7 with smart alerts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Team Collaboration</h4>
                    <p className="mt-1 text-xs text-neutral-500">Collaborate in real time with chat and workspaces.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Advanced Analytics</h4>
                    <p className="mt-1 text-xs text-neutral-500">Track productivity and deployment metrics in dashboards.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-b border-neutral-100 bg-[#fbfcfd] py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Trusted by engineering teams at
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 grayscale hover:opacity-85 transition duration-300">
            {/* Google */}
            <div className="flex items-center gap-1.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-semibold text-lg tracking-tight text-neutral-800">Google</span>
            </div>
            {/* Microsoft */}
            <div className="flex items-center gap-1.5">
              <svg className="h-4.5 w-4.5" viewBox="0 0 23 23" fill="currentColor">
                <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022"/>
                <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7fba00"/>
                <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00a4ef"/>
                <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900"/>
              </svg>
              <span className="font-semibold text-base tracking-tight text-neutral-800">Microsoft</span>
            </div>
            {/* Amazon */}
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tighter text-neutral-800">amazon</span>
            </div>
            {/* Spotify */}
            <div className="flex items-center gap-1.5">
              <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.336.135-.668.47-.743 3.856-.88 7.15-.502 9.82 1.13.295.178.387.563.207.858zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.108-.85.52-.975 3.66-1.11 8.224-.57 11.35 1.354.366.226.487.707.26 1.073zm.106-2.823C14.393 8.74 8.416 8.543 4.962 9.59c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.963-1.202 10.55-.975 14.654 1.46.478.283.633.9.35 1.378-.282.478-.9.633-1.377.35z"/>
              </svg>
              <span className="font-bold text-[17px] tracking-tight text-neutral-800">Spotify</span>
            </div>
            {/* Slack */}
            <div className="flex items-center gap-1.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.761a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.78 10.134a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z"/>
              </svg>
              <span className="font-bold text-[17px] tracking-tight text-neutral-800">slack</span>
            </div>
            {/* Docker */}
            <div className="flex items-center gap-1.5">
              <svg className="h-5 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.983 11.078h2.119c.102 0 .186-.084.186-.186V9.006a.188.188 0 00-.186-.186h-2.119a.188.188 0 00-.185.186v1.886c0 .102.083.186.185.186zm-2.954-5.43h2.118c.103 0 .187-.083.187-.185V3.577a.186.186 0 00-.187-.186h-2.118a.185.185 0 00-.185.186v1.886c0 .102.083.185.185.185zm0 2.716h2.118c.103 0 .187-.084.187-.186V6.291a.186.186 0 00-.187-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186zm-2.93 2.714h2.119c.101 0 .185-.084.185-.186V9.006a.185.185 0 00-.185-.186H8.1c-.103 0-.186.084-.186.186v1.886c0 .102.083.186.186.186zm0-2.716h2.119c.101 0 .185-.084.185-.186V6.291a.185.185 0 00-.185-.185H8.1c-.103 0-.186.084-.186.185v1.887c0 .102.083.186.186.186zm-2.928 2.716h2.117c.103 0 .187-.084.187-.186V9.006a.187.187 0 00-.187-.186H5.17c-.102 0-.186.084-.186.186v1.886c0 .102.084.186.186.186zm-2.927 0h2.12c.101 0 .185-.084.185-.186V9.006a.185.185 0 00-.185-.186h-2.12a.185.185 0 00-.185.186v1.886c0 .102.084.186.185.186zm-2.927 0h2.119c.103 0 .187-.084.187-.186V9.006a.188.188 0 00-.187-.186H-.67a.188.188 0 00-.186.186v1.886c0 .102.083.186.186.186zm21.758-2.204a2.91 2.91 0 00-.613-.76c-.247-.215-.558-.337-.881-.345H17.27a.188.188 0 00-.185.185v2.118c0 .102.083.186.185.186h2.119c.813 0 1.48.617 1.6 1.409.28 1.89-.413 3.655-1.722 4.636-1.127.844-2.617.962-3.864.962h-.034c-.394 0-.805-.015-1.17-.11-.476-.123-.84-.526-.957-1.002-.38-1.517-1.637-2.618-3.155-2.618-.466 0-.916.115-1.312.314a.12.12 0 01-.115.004.116.116 0 01-.06-.103v-4.103a.186.186 0 00-.185-.186h-2.119a.186.186 0 00-.185.186v4.469c0 .13-.035.257-.1.37a5.568 5.568 0 01-.849 1.018c-.147.135-.3.262-.464.377-.188.129-.408.24-.627.342-.239.109-.488.204-.743.279a8.673 8.673 0 01-2.483.359c-.393 0-.785-.015-1.178-.044a.12.12 0 01-.111-.118V12.17a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.186.186v6.234a.12.12 0 01-.118.12c-2.673.04-5.26-.53-6.936-2.585-.195-.24-.356-.5-.487-.773-.131-.274-.21-.563-.238-.868a3.036 3.036 0 01.353-1.733c.257-.426.634-.764 1.084-.972.179-.083.363-.153.551-.21a8.552 8.552 0 012.385-.337c.394 0 .787.015 1.18.044.066.005.12-.045.12-.111V8.627a.186.186 0 00-.186-.186H2.235a.186.186 0 00-.186.186v2.119c0 .102-.084.186-.186.186H-.256A.186.186 0 00-.44 11.05V7.472a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.186.186v5.82a7.924 7.924 0 001.272 4.195 9.07 9.07 0 003.541 3.256c2.091.996 4.49 1.168 6.757 1.168h14.773c3.197 0 6.068-1.503 7.643-4.28a7.808 7.808 0 001.077-4.148c.005-1.584-.523-3.116-1.488-4.32z"/>
              </svg>
              <span className="font-bold text-[17px] tracking-tight text-neutral-800">docker</span>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 bg-white border-b border-neutral-100">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
            Powered Features
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-neutral-900 sm:text-4xl tracking-tight max-w-2xl mx-auto leading-tight">
            Everything your team needs to build and ship better software
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-neutral-200/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Code2 size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">AI Code Review</h3>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed font-medium">
                Get intelligent code reviews, bug detections, and optimization suggestions in seconds.
              </p>
            </div>
            <button
              onClick={onExplore}
              className="group/btn mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Watch feature
              <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-neutral-200/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MonitorDot size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Real-time Monitoring</h3>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed font-medium">
                Monitor your entire infrastructure and services in real time with smart alerts.
              </p>
            </div>
            <button
              onClick={onExplore}
              className="group/btn mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Watch feature
              <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-neutral-200/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <Users size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Team Collaboration</h3>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed font-medium">
                Collaborate with your team in real time with chat, audio/video calls and shared workspaces.
              </p>
            </div>
            <button
              onClick={onExplore}
              className="group/btn mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Watch feature
              <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 4 */}
          <div className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-neutral-200/80 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                <BarChart3 size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">Advanced Analytics</h3>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed font-medium">
                Track performance, productivity and deployment metrics in beautiful dashboards.
              </p>
            </div>
            <button
              onClick={onExplore}
              className="group/btn mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Watch feature
              <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Ready to Transform Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="rounded-3xl bg-indigo-50/40 border border-indigo-100/50 p-8 md:p-12 shadow-sm">
          <div className="grid gap-10 items-center lg:grid-cols-12">
            {/* Left Preview Graphic */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative rounded-2xl border border-neutral-100 bg-white p-5 shadow-lg max-w-[280px] w-full">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Deployments</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">↑ 24.5%</span>
                </div>
                
                {/* Simple line chart drawing */}
                <div className="h-16 w-full mb-4">
                  <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 30" fill="none">
                    <path d="M0 25 C15 20, 25 10, 40 18 C55 26, 70 5, 100 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M0 25 C15 20, 25 10, 40 18 C55 26, 70 5, 100 8 L 100 30 L 0 30 Z" fill="url(#chartGrad)" opacity="0.1" />
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="30">
                        <stop stopColor="#6366F1" />
                        <stop stopColor="#6366F1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
                  {/* Avatars */}
                  <div className="flex -space-x-2">
                    <span className="inline-block h-6 w-6 rounded-full border border-white bg-gradient-to-tr from-indigo-500 to-purple-500" />
                    <span className="inline-block h-6 w-6 rounded-full border border-white bg-gradient-to-tr from-emerald-400 to-teal-500" />
                    <span className="inline-block h-6 w-6 rounded-full border border-white bg-gradient-to-tr from-sky-400 to-blue-500" />
                    <span className="inline-block h-6 w-6 rounded-full border border-white bg-gradient-to-tr from-amber-400 to-orange-500" />
                  </div>
                  {/* Users badge */}
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Users size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Center Text */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug">
                Ready to transform your development workflow?
              </h2>
              <p className="mt-4 text-neutral-500 text-sm leading-relaxed font-medium">
                Join thousands of developers who are already building better software with DevWatch AI.
              </p>
            </div>

            {/* Right Buttons */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
              <button
                onClick={onEnter}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 hover:shadow-lg w-full text-center"
              >
                Sign up for free
                <ArrowRight size={15} />
              </button>
              <button
                onClick={onEnter}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 w-full text-center"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-neutral-100 bg-white py-16 mt-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            {/* Brand Column */}
            <div className="col-span-2 flex flex-col items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 40 40" fill="none">
                    <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
                    <path d="M16 15L11 20L16 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M24 15L29 20L24 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-tight text-neutral-900">
                  DevWatch <span className="text-indigo-600 font-semibold">AI</span>
                </span>
              </div>
              <p className="mt-4 text-xs text-neutral-400 max-w-xs leading-relaxed font-medium">
                The all-in-one AI-powered platform for modern development teams.
              </p>
              <p className="mt-6 text-xs text-neutral-400 font-medium">
                © 2024 DevWatch AI. All rights reserved.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Product</h4>
              <ul className="mt-4 space-y-2">
                {["Features", "Integrations", "Changelog", "Pricing"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFooterItem(item);
                      }}
                      className="text-xs text-neutral-500 hover:text-indigo-600 transition font-medium text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Solutions</h4>
              <ul className="mt-4 space-y-2">
                {["Dev Teams", "Startups", "Enterprises", "Remote Teams"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFooterItem(item);
                      }}
                      className="text-xs text-neutral-500 hover:text-indigo-600 transition font-medium text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Resources</h4>
              <ul className="mt-4 space-y-2">
                {["Docs", "Blog", "Help Center", "Status"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFooterItem(item);
                      }}
                      className="text-xs text-neutral-500 hover:text-indigo-600 transition font-medium text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {["About Us", "Careers", "Contact", "Privacy Policy"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFooterItem(item);
                      }}
                      className="text-xs text-neutral-400 hover:text-indigo-600 transition font-medium text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Info Detail Modal for Footer Links */}
      {activeFooterItem && footerContent[activeFooterItem] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveFooterItem(null)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden border border-neutral-100 bg-white p-6 shadow-2xl rounded-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveFooterItem(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="flex flex-col text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                {footerContent[activeFooterItem].title}
              </h3>
              <p className="text-xs text-neutral-500 mt-2 font-medium leading-relaxed">
                {footerContent[activeFooterItem].desc}
              </p>

              {/* Bullet details */}
              <ul className="mt-5 space-y-3">
                {footerContent[activeFooterItem].details.map((detail, index) => (
                  <li key={index} className="flex gap-2.5 items-start text-[11px] font-semibold text-neutral-600 leading-normal">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => {
                  setActiveFooterItem(null);
                  onEnter();
                }}
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:shadow-lg transition hover:bg-indigo-700 cursor-pointer"
              >
                Access Dashboard Workspace
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

