"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Bot,
  ChevronLeft,
  CircleDot,
  Download,
  FileCode2,
  Folder,
  Gauge,
  MailPlus,
  MessageSquare,
  Play,
  Plus,
  Rocket,
  Save,
  Send,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { Badge, Button, IconButton, ProgressBar } from "@/components/ui";
import {
  chatMessages,
  files,
  members,
  monitoringSeries,
  projects,
  reviewIssues,
  workspace
} from "@/lib/mock-data";
import type { ChatMessage, WorkspaceFile } from "@/lib/mock-data";
import { cn, initials } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-sm text-neutral-500">
      Loading editor...
    </div>
  )
});

type InspectorPanel = "ai" | "chat" | "monitoring";

export function CloudIDE({
  projectId,
  onBack,
  onDashboard
}: {
  projectId: string;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>(files);
  const [activeFileId, setActiveFileId] = useState(files[0].id);
  const [openTabs, setOpenTabs] = useState<string[]>([files[0].id, files[1].id]);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(files.map((file) => [file.id, file.content]))
  );
  const [panel, setPanel] = useState<InspectorPanel>("ai");
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Auto saved just now");
  const inspectorTabs = [
    ["ai", Bot, "AI"],
    ["chat", MessageSquare, "Chat"],
    ["monitoring", Gauge, "Monitor"]
  ] as const;

  const activeFile =
    workspaceFiles.find((file) => file.id === activeFileId) ?? workspaceFiles[0];

  const tabs = useMemo(
    () =>
      openTabs
        .map((id) => workspaceFiles.find((file) => file.id === id))
        .filter(Boolean) as WorkspaceFile[],
    [openTabs, workspaceFiles]
  );

  function openFile(file: WorkspaceFile) {
    setActiveFileId(file.id);
    setOpenTabs((current) =>
      current.includes(file.id) ? current : [...current, file.id]
    );
  }

  function createFile() {
    const nextNumber = workspaceFiles.length + 1;
    const file: WorkspaceFile = {
      id: `new-${Date.now()}`,
      name: `feature-${nextNumber}.ts`,
      path: `/src/feature-${nextNumber}.ts`,
      language: "typescript",
      editedBy: "Harsh",
      content: [
        "export function nextFeature() {",
        "  return \"Ready for DevWatch AI review\";",
        "}"
      ].join("\n")
    };

    setWorkspaceFiles((current) => [...current, file]);
    setDrafts((current) => ({ ...current, [file.id]: file.content }));
    setOpenTabs((current) => [...current, file.id]);
    setActiveFileId(file.id);
    setStatus("New file created");
  }

  function renameFile() {
    const nextName = window.prompt("Rename file", activeFile.name);
    if (!nextName) return;

    setWorkspaceFiles((current) =>
      current.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              name: nextName,
              path: file.path.replace(file.name, nextName)
            }
          : file
      )
    );
    setStatus("File renamed");
  }

  function deleteFile() {
    if (workspaceFiles.length <= 1) return;

    const remaining = workspaceFiles.filter((file) => file.id !== activeFile.id);
    setWorkspaceFiles(remaining);
    setOpenTabs((current) => current.filter((id) => id !== activeFile.id));
    setActiveFileId(remaining[0].id);
    setStatus("File deleted");
  }

  function sendMessage() {
    if (!message.trim()) return;

    setMessages((current) => [
      ...current,
      {
        sender: "Harsh",
        message: message.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      }
    ]);
    setMessage("");
  }

  function exportProject() {
    const payload = JSON.stringify(
      {
        project: project.name,
        exportedAt: new Date().toISOString(),
        files: workspaceFiles.map((file) => ({
          path: file.path,
          content: drafts[file.id] ?? file.content
        }))
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.id}-devwatch-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Export package generated");
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-mist text-neutral-950">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3">
        <Button onClick={onBack}>
          <ChevronLeft size={16} />
          Projects
        </Button>
        <button
          onClick={onDashboard}
          className="mr-auto flex items-center gap-3 rounded-md px-2 py-1 text-left hover:bg-neutral-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-xs font-semibold text-white">
            DW
          </span>
          <span>
            <span className="block text-sm font-semibold">{project.name}</span>
            <span className="block text-xs text-neutral-500">{status}</span>
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setStatus("Saved to MongoDB draft")}>
            <Save size={16} />
            Save
          </Button>
          <Button>
            <Play size={16} />
            Run
          </Button>
          <Button>
            <Rocket size={16} />
            Deploy
          </Button>
          <Button onClick={() => setPanel("ai")}>
            <Sparkles size={16} />
            AI Review
          </Button>
          <Button onClick={exportProject}>
            <Download size={16} />
            Export ZIP
          </Button>
          <Button variant="primary" onClick={() => setPanel("chat")}>
            <MailPlus size={16} />
            Invite Team
          </Button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 border-r border-line bg-white lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b border-line p-4">
            <div>
              <p className="text-sm font-semibold text-neutral-950">Files</p>
              <p className="text-xs text-neutral-500">MongoDB synced</p>
            </div>
            <div className="flex gap-2">
              <IconButton label="Create file" onClick={createFile}>
                <Plus size={16} />
              </IconButton>
              <IconButton label="Rename file" onClick={renameFile}>
                <FileCode2 size={16} />
              </IconButton>
              <IconButton label="Delete file" onClick={deleteFile}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-3 flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-neutral-700">
              <Folder size={16} className="text-amber-600" />
              {project.name.toLowerCase().replaceAll(" ", "-")}
            </div>
            <div className="space-y-1">
              {workspaceFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => openFile(file)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                    activeFileId === file.id
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  <FileCode2 size={16} />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col border-r border-line bg-white">
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-neutral-50 px-2 pt-2">
            {tabs.map((file) => (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-3 text-sm",
                  activeFileId === file.id
                    ? "border-line bg-white text-neutral-950"
                    : "border-transparent text-neutral-500 hover:bg-white"
                )}
              >
                <FileCode2 size={15} />
                {file.name}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <MonacoEditor
              height="100%"
              language={activeFile.language}
              theme="vs"
              value={drafts[activeFile.id] ?? activeFile.content}
              onChange={(value) => {
                setDrafts((current) => ({
                  ...current,
                  [activeFile.id]: value ?? ""
                }));
                setStatus("Editing live draft");
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                wordWrap: "on"
              }}
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="grid grid-cols-3 border-b border-line p-2">
            {inspectorTabs.map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setPanel(key)}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium",
                  panel === key
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === "ai" ? <AIReviewPanel /> : null}
            {panel === "chat" ? (
              <ChatPanel
                messages={messages}
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
              />
            ) : null}
            {panel === "monitoring" ? <MonitorPanel /> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}

function AIReviewPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-neutral-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-950">AI Score</p>
          <Badge tone="green">89</Badge>
        </div>
        <div className="mt-4">
          <ProgressBar value={89} tone="green" />
        </div>
      </div>

      <div className="space-y-3">
        {reviewIssues.map((issue) => (
          <div key={issue.title} className="rounded-lg border border-line p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 text-violet-700" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-950">
                  {issue.title}
                </p>
                <p className="mt-1 truncate text-xs text-neutral-500">
                  {issue.file}
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full justify-center">
              <Wand2 size={16} />
              Apply Fix
            </Button>
          </div>
        ))}
      </div>

      <Button variant="primary" className="w-full">
        <Bot size={16} />
        Full Project Analysis
      </Button>
    </div>
  );
}

function ChatPanel({
  messages,
  message,
  setMessage,
  sendMessage
}: {
  messages: ChatMessage[];
  message: string;
  setMessage: (value: string) => void;
  sendMessage: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-4 space-y-3">
        {members.slice(0, 3).map((member) => (
          <div key={member.email} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white",
                member.color
              )}
            >
              {initials(member.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-950">
                {member.name.split(" ")[0]}
              </p>
              <p className="text-xs text-neutral-500">{member.status}</p>
            </div>
            <CircleDot size={13} className="text-emerald-500" />
          </div>
        ))}
      </div>

      <div className="min-h-[320px] flex-1 space-y-3 rounded-lg border border-line bg-neutral-50 p-3">
        {messages.map((item, index) => (
          <div
            key={`${item.sender}-${item.time}-${index}`}
            className={cn(
              "rounded-lg bg-white p-3 text-sm shadow-sm",
              item.sender === "Harsh" ? "ml-8" : "mr-8"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-neutral-950">{item.sender}</p>
              <p className="text-xs text-neutral-400">{item.time}</p>
            </div>
            <p className="mt-1 text-neutral-700">{item.message}</p>
          </div>
        ))}
        <p className="px-1 text-xs text-neutral-500">Rahul is typing...</p>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          className="h-10 min-w-0 flex-1 rounded-md border border-line px-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
          placeholder="Message #frontend"
        />
        <IconButton label="Send message" onClick={sendMessage}>
          <Send size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function MonitorPanel() {
  const latest = monitoringSeries.at(-1) ?? monitoringSeries[0];
  const monitorMetrics = [
    ["CPU", latest.cpu, "violet"],
    ["RAM", latest.ram, "amber"],
    ["Latency", Math.round((latest.latency / 180) * 100), "blue"]
  ] as const;

  return (
    <div className="space-y-4">
      {monitorMetrics.map(([label, value, tone]) => (
        <div key={label} className="rounded-lg border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-950">
              {label}
            </p>
            <span className="text-sm font-semibold text-neutral-950">
              {label === "Latency" ? `${latest.latency}ms` : `${value}%`}
            </span>
          </div>
          <ProgressBar value={value} tone={tone} />
        </div>
      ))}

      <div className="rounded-lg border border-line bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CircleDot size={16} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-900">
            Uptime {workspace.uptime}
          </p>
        </div>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Production health is stable. No active deploy block.
        </p>
      </div>
    </div>
  );
}
