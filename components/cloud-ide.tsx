"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  Code2,
  Download,
  FileCode2,
  Folder,
  Gauge,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  Rocket,
  Save,
  Send,
  Trash2,
  Wand2
} from "lucide-react";
import { Button, IconButton } from "@/components/ui";
import { apiData, apiFetch, downloadUrl } from "@/lib/api";
import type {
  AIReview,
  ApiResponse,
  ChatMessage,
  MonitoringRecord,
  Project,
  UserSession,
  WorkspaceFile
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-sm text-neutral-500">
      Loading editor
    </div>
  ),
  ssr: false
});

type InspectorPanel = "ai" | "chat" | "monitoring";

interface AssistantResult {
  kind: string;
  data: unknown;
}

export function CloudIDE({
  projectId,
  projectName,
  token,
  user,
  onBack,
  onDashboard
}: {
  projectId: string;
  projectName?: string;
  token: string;
  user: UserSession;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirtyFileId, setDirtyFileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringRecord[]>([]);
  const [panel, setPanel] = useState<InspectorPanel>("ai");
  const [message, setMessage] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [status, setStatus] = useState("Loading project");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const tabs = useMemo(
    () =>
      openTabs
        .map((id) => files.find((file) => file.id === id))
        .filter(Boolean) as WorkspaceFile[],
    [files, openTabs]
  );
  const displayName = project?.projectName || projectName || "DevWatch Project";
  const activeContent = activeFile ? drafts[activeFile.id] ?? activeFile.content : "";

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!dirtyFileId) return;
    const file = files.find((item) => item.id === dirtyFileId);
    if (!file) return;

    const timer = window.setTimeout(() => {
      void saveFile(file, false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [dirtyFileId, drafts, files]);

  async function loadProject() {
    setLoading(true);
    setError(null);

    try {
      const [projectData, fileData, chatData, monitoringData] = await Promise.all([
        apiData<Project>(`/api/projects/${projectId}`, { token }),
        apiData<WorkspaceFile[]>(`/api/files?projectId=${projectId}`, { token }),
        apiData<ChatMessage[]>(`/api/chat?projectId=${projectId}`, { token }),
        apiData<MonitoringRecord[]>(`/api/monitoring?projectId=${projectId}`, {
          token
        })
      ]);

      setProject(projectData);
      setFiles(fileData);
      setDrafts(Object.fromEntries(fileData.map((file) => [file.id, file.content || ""])));
      setOpenTabs(fileData[0] ? [fileData[0].id] : []);
      setActiveFileId(fileData[0]?.id || null);
      setMessages(chatData);
      setMonitoring(monitoringData);
      setStatus(fileData.length ? "MongoDB synced" : "Create a file to start");
    } catch (loadError) {
      setError(errorMessage(loadError));
      setStatus("Project failed to load");
    } finally {
      setLoading(false);
    }
  }

  function openFile(file: WorkspaceFile) {
    setActiveFileId(file.id);
    setOpenTabs((current) =>
      current.includes(file.id) ? current : [...current, file.id]
    );
  }

  async function createFile() {
    const path = window.prompt("File path", "/src/index.ts");
    if (!path?.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const file = await apiData<WorkspaceFile>("/api/files", {
        method: "POST",
        token,
        body: {
          projectId,
          path: normalizePath(path),
          content: "",
          language: languageFromPath(path)
        }
      });

      setFiles((current) => upsertById(current, file));
      setDrafts((current) => ({ ...current, [file.id]: file.content || "" }));
      setOpenTabs((current) => (current.includes(file.id) ? current : [...current, file.id]));
      setActiveFileId(file.id);
      setStatus("File created");
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function saveFile(file: WorkspaceFile | null = activeFile, explicit = true) {
    if (!file) return;

    setSaving(true);
    setError(null);

    try {
      const saved = await apiData<WorkspaceFile>("/api/files", {
        method: "POST",
        token,
        body: {
          projectId,
          path: file.path,
          content: drafts[file.id] ?? file.content,
          language: file.language,
          type: file.type
        }
      });

      setFiles((current) => upsertById(current, saved));
      setDrafts((current) => ({ ...current, [saved.id]: saved.content || "" }));
      setDirtyFileId((current) => (current === file.id ? null : current));
      setStatus(explicit ? "Saved to MongoDB" : "Auto saved");
    } catch (saveError) {
      setError(errorMessage(saveError));
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function renameFile() {
    if (!activeFile) return;
    const nextPath = window.prompt("New file path", activeFile.path);
    if (!nextPath?.trim() || normalizePath(nextPath) === activeFile.path) return;

    setSaving(true);
    setError(null);

    try {
      const saved = await apiData<WorkspaceFile>("/api/files", {
        method: "POST",
        token,
        body: {
          projectId,
          path: normalizePath(nextPath),
          content: drafts[activeFile.id] ?? activeFile.content,
          language: languageFromPath(nextPath)
        }
      });
      await apiFetch<ApiResponse<WorkspaceFile>>(`/api/files/${activeFile.id}`, {
        method: "DELETE",
        token
      });

      setFiles((current) => [saved, ...current.filter((file) => file.id !== activeFile.id)]);
      setDrafts((current) => {
        const next = { ...current };
        delete next[activeFile.id];
        next[saved.id] = saved.content || "";
        return next;
      });
      setOpenTabs((current) =>
        current.map((id) => (id === activeFile.id ? saved.id : id))
      );
      setActiveFileId(saved.id);
      setStatus("File renamed");
    } catch (renameError) {
      setError(errorMessage(renameError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteFile() {
    if (!activeFile) return;
    const confirmed = window.confirm(`Delete ${activeFile.path}?`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await apiFetch<ApiResponse<WorkspaceFile>>(`/api/files/${activeFile.id}`, {
        method: "DELETE",
        token
      });
      const remaining = files.filter((file) => file.id !== activeFile.id);
      setFiles(remaining);
      setDrafts((current) => {
        const next = { ...current };
        delete next[activeFile.id];
        return next;
      });
      setOpenTabs((current) => current.filter((id) => id !== activeFile.id));
      setActiveFileId(remaining[0]?.id || null);
      setStatus("File deleted");
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!message.trim()) return;

    try {
      const chat = await apiData<ChatMessage>("/api/chat", {
        method: "POST",
        token,
        body: {
          projectId,
          message: message.trim()
        }
      });
      setMessages((current) => [...current, chat]);
      setMessage("");
    } catch (chatError) {
      setError(errorMessage(chatError));
    }
  }

  async function runReview() {
    if (!activeFile) return;

    setPanel("ai");
    setAiLoading(true);
    setError(null);

    try {
      const result = await apiData<AIReview>("/api/ai/review", {
        method: "POST",
        token,
        body: {
          projectId,
          fileId: activeFile.id,
          filePath: activeFile.path,
          code: activeContent
        }
      });
      setReview(result);
      setAssistantResult({ kind: "Code Review", data: result });
      setStatus("AI review stored");
    } catch (reviewError) {
      setError(errorMessage(reviewError));
    } finally {
      setAiLoading(false);
    }
  }

  async function runProjectAnalysis() {
    setPanel("ai");
    setAiLoading(true);
    setError(null);

    try {
      const result = await apiData<AIReview>("/api/ai/project-analysis", {
        method: "POST",
        token,
        body: { projectId }
      });
      setReview(result);
      setAssistantResult({ kind: "Project Analysis", data: result });
      setStatus("Project analysis stored");
    } catch (analysisError) {
      setError(errorMessage(analysisError));
    } finally {
      setAiLoading(false);
    }
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assistantQuestion.trim()) return;

    setAiLoading(true);
    setError(null);

    try {
      const result = await apiData<unknown>("/api/ai/chat", {
        method: "POST",
        token,
        body: {
          projectId,
          question: assistantQuestion.trim(),
          context: activeFile
            ? {
                filePath: activeFile.path,
                code: activeContent
              }
            : undefined
        }
      });
      setAssistantResult({ kind: "AI Assistant", data: result });
      setAssistantQuestion("");
    } catch (assistantError) {
      setError(errorMessage(assistantError));
    } finally {
      setAiLoading(false);
    }
  }

  async function runAutoFix() {
    if (!activeFile || !review?.issues?.length) return;

    setAiLoading(true);
    setError(null);

    try {
      const result = await apiData<{ fixedCode?: string; summary?: string }>(
        "/api/ai/auto-fix",
        {
          method: "POST",
          token,
          body: {
            filePath: activeFile.path,
            code: activeContent,
            issue: review.issues[0]
          }
        }
      );

      if (result.fixedCode) {
        setDrafts((current) => ({
          ...current,
          [activeFile.id]: result.fixedCode || activeContent
        }));
        setDirtyFileId(activeFile.id);
      }
      setAssistantResult({ kind: "Auto Fix", data: result });
    } catch (fixError) {
      setError(errorMessage(fixError));
    } finally {
      setAiLoading(false);
    }
  }

  async function exportProject() {
    setError(null);

    try {
      const response = await fetch(downloadUrl(`/api/projects/${projectId}/export`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Project export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("ZIP exported");
    } catch (exportError) {
      setError(errorMessage(exportError));
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f7f8fb] text-neutral-950">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <Button onClick={onBack}>
          <ChevronLeft size={16} />
          Projects
        </Button>
        <button
          className="mr-auto flex min-w-0 items-center gap-3 rounded-md px-2 py-1 text-left hover:bg-neutral-50"
          onClick={onDashboard}
          type="button"
        >
          <svg
            className="w-9 h-9 shrink-0"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-outline-grad-ide" x1="0%" y1="0%" x2="100%" y2="100%">
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
                stroke="url(#logo-outline-grad-ide)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
            <path
              d="M 39 42 L 31 50 L 39 58"
              stroke="url(#logo-outline-grad-ide)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 47 36 L 53 64"
              stroke="url(#logo-outline-grad-ide)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 61 42 L 69 50 L 61 58"
              stroke="url(#logo-outline-grad-ide)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{displayName}</span>
            <span className="block truncate text-xs text-neutral-500">{status}</span>
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!activeFile || saving} onClick={() => void saveFile()}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save
          </Button>
          <Button disabled title="Runtime execution service is not configured.">
            <Play size={16} />
            Run
          </Button>
          <Button disabled title="Deployment execution service is not configured.">
            <Rocket size={16} />
            Deploy
          </Button>
          <Button disabled={!activeFile || aiLoading} onClick={runReview}>
            {aiLoading && panel === "ai" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Bot size={16} />
            )}
            AI Review
          </Button>
          <Button onClick={exportProject}>
            <Download size={16} />
            Export ZIP
          </Button>
        </div>
      </header>

      {error ? (
        <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <section className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_370px]">
        <aside className="hidden min-h-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 p-4">
            <div>
              <p className="text-sm font-semibold text-neutral-950">Files</p>
              <p className="text-xs text-neutral-500">Saved in MongoDB</p>
            </div>
            <div className="flex gap-2">
              <IconButton label="Create file" onClick={createFile}>
                <Plus size={16} />
              </IconButton>
              <IconButton disabled={!activeFile} label="Rename file" onClick={renameFile}>
                <FileCode2 size={16} />
              </IconButton>
              <IconButton disabled={!activeFile} label="Delete file" onClick={deleteFile}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-3 flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-neutral-700">
              <Folder size={16} className="text-amber-600" />
              {displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            </div>
            {files.length ? (
              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                      activeFileId === file.id
                        ? "bg-neutral-950 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                    key={file.id}
                    onClick={() => openFile(file)}
                    type="button"
                  >
                    <FileCode2 size={16} />
                    <span className="min-w-0 flex-1 truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState action={createFile} actionLabel="Create File" title="No files yet">
                Create the first project file to start editing.
              </EmptyState>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col border-r border-neutral-200 bg-white">
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-2 pt-2">
            {tabs.map((file) => (
              <button
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-3 text-sm",
                  activeFileId === file.id
                    ? "border-neutral-200 bg-white text-neutral-950"
                    : "border-transparent text-neutral-500 hover:bg-white"
                )}
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                type="button"
              >
                <FileCode2 size={15} />
                {file.name}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                Loading project
              </div>
            ) : activeFile ? (
              <MonacoEditor
                height="100%"
                language={activeFile.language}
                onChange={(value) => {
                  setDrafts((current) => ({
                    ...current,
                    [activeFile.id]: value || ""
                  }));
                  setDirtyFileId(activeFile.id);
                  setStatus("Editing draft");
                }}
                options={{
                  fontSize: 14,
                  lineHeight: 22,
                  minimap: { enabled: false },
                  padding: { bottom: 16, top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on"
                }}
                theme="vs"
                value={activeContent}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6">
                <EmptyState action={createFile} actionLabel="Create File" title="No file open">
                  Create a file from the file panel to open the editor.
                </EmptyState>
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="grid grid-cols-3 border-b border-neutral-200 p-2">
            <InspectorTab active={panel === "ai"} icon={<Bot size={16} />} label="AI" onClick={() => setPanel("ai")} />
            <InspectorTab active={panel === "chat"} icon={<MessageSquare size={16} />} label="Chat" onClick={() => setPanel("chat")} />
            <InspectorTab active={panel === "monitoring"} icon={<Gauge size={16} />} label="Monitor" onClick={() => setPanel("monitoring")} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === "ai" ? (
              <AIReviewPanel
                activeFile={activeFile}
                assistantQuestion={assistantQuestion}
                assistantResult={assistantResult}
                loading={aiLoading}
                review={review}
                setAssistantQuestion={setAssistantQuestion}
                askAssistant={askAssistant}
                runAutoFix={runAutoFix}
                runProjectAnalysis={runProjectAnalysis}
                runReview={runReview}
              />
            ) : null}
            {panel === "chat" ? (
              <ChatPanel
                currentUser={user}
                message={message}
                messages={messages}
                sendMessage={sendMessage}
                setMessage={setMessage}
              />
            ) : null}
            {panel === "monitoring" ? <MonitorPanel records={monitoring} /> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}

function AIReviewPanel({
  activeFile,
  assistantQuestion,
  assistantResult,
  askAssistant,
  loading,
  review,
  runAutoFix,
  runProjectAnalysis,
  runReview,
  setAssistantQuestion
}: {
  activeFile: WorkspaceFile | null;
  assistantQuestion: string;
  assistantResult: AssistantResult | null;
  askAssistant: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  review: AIReview | null;
  runAutoFix: () => void;
  runProjectAnalysis: () => void;
  runReview: () => void;
  setAssistantQuestion: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Groq AI</p>
            <p className="mt-1 text-xs text-neutral-500">
              {activeFile ? activeFile.path : "Open a file to review code"}
            </p>
          </div>
          {review ? (
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-sm font-semibold text-indigo-800">
              {review.score}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-2">
          <Button disabled={!activeFile || loading} onClick={runReview} variant="primary">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
            Run Code Review
          </Button>
          <Button disabled={loading} onClick={runProjectAnalysis}>
            <Code2 size={16} />
            Full Project Analysis
          </Button>
          <Button disabled={!review?.issues?.length || loading} onClick={runAutoFix}>
            <Wand2 size={16} />
            Auto Fix First Issue
          </Button>
        </div>
      </div>

      <form className="rounded-lg border border-neutral-200 p-4" onSubmit={askAssistant}>
        <p className="text-sm font-semibold text-neutral-950">AI Chat Assistant</p>
        <textarea
          className="mt-3 min-h-24 w-full resize-none rounded-md border border-neutral-200 p-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setAssistantQuestion(event.target.value)}
          placeholder="Ask about this project or the open file"
          value={assistantQuestion}
        />
        <Button className="mt-3 w-full" disabled={loading || !assistantQuestion.trim()} type="submit">
          <Send size={16} />
          Ask Assistant
        </Button>
      </form>

      {review?.issues?.length ? (
        <div className="space-y-3">
          {review.issues.map((issue, index) => (
            <div className="rounded-lg border border-neutral-200 p-4" key={`${issue.title}-${index}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-amber-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-neutral-950">{issue.title}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {issue.message || issue.suggestion || "No issue details provided."}
                  </p>
                  {issue.filePath ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      {issue.filePath}
                      {issue.line ? `:${issue.line}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {assistantResult ? (
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-950">{assistantResult.kind}</p>
          <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-neutral-950 p-3 text-xs leading-5 text-neutral-100">
            {JSON.stringify(assistantResult.data, null, 2)}
          </pre>
        </div>
      ) : (
        <EmptyState title="No AI result yet">Run a review, analysis, auto-fix, or assistant question.</EmptyState>
      )}
    </div>
  );
}

function ChatPanel({
  currentUser,
  message,
  messages,
  sendMessage,
  setMessage
}: {
  currentUser: UserSession;
  message: string;
  messages: ChatMessage[];
  sendMessage: (event?: FormEvent<HTMLFormElement>) => void;
  setMessage: (value: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="min-h-[360px] flex-1 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        {messages.length ? (
          messages.map((item) => {
            const sender = senderName(item.sender, currentUser);
            return (
              <div className="rounded-lg border border-neutral-200 bg-white p-3" key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">{sender}</p>
                  <p className="text-xs text-neutral-400">{formatTime(item.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{item.message}</p>
              </div>
            );
          })
        ) : (
          <EmptyState title="No chat messages">Send the first project message.</EmptyState>
        )}
      </div>

      <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message this project"
          value={message}
        />
        <IconButton label="Send message" type="submit">
          <Send size={16} />
        </IconButton>
      </form>
    </div>
  );
}

function MonitorPanel({ records }: { records: MonitoringRecord[] }) {
  const latest = records[0];

  if (!latest) {
    return (
      <EmptyState title="No monitoring data">
        Monitoring records will appear after the backend stores CPU, RAM, latency, and uptime values for this project.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <Metric label="CPU" value={`${latest.cpu}%`} />
      <Metric label="RAM" value={`${latest.ram}%`} />
      <Metric label="Latency" value={`${latest.latency}ms`} />
      <Metric label="Uptime" value={`${latest.uptime ?? 0}%`} />
      {latest.alerts?.length ? (
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-950">Alerts</p>
          <div className="mt-3 space-y-2">
            {latest.alerts.map((alert, index) => (
              <p className="text-sm text-neutral-700" key={`${alert.message}-${index}`}>
                {alert.message || alert.type || "Monitoring alert"}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InspectorTab({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium",
        active ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-50"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({
  action,
  actionLabel,
  children,
  title
}: {
  action?: () => void;
  actionLabel?: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{children}</p>
      {action && actionLabel ? (
        <Button className="mt-4" onClick={action} variant="primary">
          <Plus size={16} />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const exists = items.some((current) => current.id === item.id);
  return exists
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

function normalizePath(path: string) {
  const trimmed = path.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function languageFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  const languages: Record<string, string> = {
    css: "css",
    html: "html",
    js: "javascript",
    json: "json",
    jsx: "javascript",
    md: "markdown",
    py: "python",
    ts: "typescript",
    tsx: "typescript"
  };

  return extension ? languages[extension] || "plaintext" : "plaintext";
}

function senderName(sender: ChatMessage["sender"], currentUser: UserSession) {
  if (sender && typeof sender === "object") {
    return sender.name || sender.email || "Team member";
  }

  if (sender === currentUser.id || sender === currentUser.uid) {
    return currentUser.name;
  }

  return "Team member";
}

function formatTime(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
