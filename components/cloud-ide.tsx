"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { OnMount } from "@monaco-editor/react";
import { io, type Socket } from "socket.io-client";
import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  Code2,
  Download,
  FilePlus2,
  Gauge,
  History,
  Import,
  Loader2,
  MessageSquare,
  Play,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Square,
  Upload,
  UserPlus,
  Users,
  Wand2,
  X
} from "lucide-react";
import { FileExplorer } from "@/components/file-explorer";
import { Button, IconButton } from "@/components/ui";
import { API_BASE, ApiError, apiData, apiFetch, downloadUrl } from "@/lib/api";
import type {
  AIReview,
  ApiResponse,
  ChatMessage,
  Deployment,
  Execution,
  FileVersion,
  ImportResult,
  MonitoringRecord,
  Project,
  ProjectPresence,
  UserSession,
  WorkspaceFile
} from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-sm text-neutral-500">
      Loading editor
    </div>
  ),
  ssr: false
});

type InspectorPanel = "ai" | "chat" | "monitoring" | "console" | "history";

interface AssistantResult {
  kind: string;
  data: unknown;
}

interface AutoFixPreview {
  summary?: string;
  fixedCode?: string;
  changes?: string[];
  risks?: string[];
  testsToRun?: string[];
}

interface PendingSave {
  fileId: string;
  content: string;
  revision: number;
}

const supportedExtensions = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "html",
  "css",
  "md",
  "txt",
  "py",
  "java",
  "cpp",
  "c",
  "go",
  "rs",
  "yaml",
  "yml",
  "env"
]);

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
  const socketRef = useRef<Socket | null>(null);
  const toolbarImportRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirtyFileId, setDirtyFileId] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [monitoring, setMonitoring] = useState<MonitoringRecord[]>([]);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [presence, setPresence] = useState<ProjectPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [panel, setPanel] = useState<InspectorPanel>("ai");
  const [message, setMessage] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [pendingFix, setPendingFix] = useState<AutoFixPreview | null>(null);
  const [conflict, setConflict] = useState<WorkspaceFile | null>(null);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [status, setStatus] = useState("Loading project");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const activeExecution = executions.find((execution) => execution.status === "running") || null;
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
    const stored = window.localStorage.getItem(`devwatch_explorer_${projectId}`);
    if (stored) {
      try {
        setExpandedPaths(new Set(JSON.parse(stored) as string[]));
      } catch {
        setExpandedPaths(new Set());
      }
    }
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    window.localStorage.setItem(
      `devwatch_explorer_${projectId}`,
      JSON.stringify([...expandedPaths])
    );
  }, [expandedPaths, projectId]);

  useEffect(() => {
    const socket = io(API_BASE, {
      auth: { token },
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("project:join", { projectId });
    });
    socket.on("presence:list", (items: ProjectPresence[]) => setPresence(items));
    socket.on("file:change", (payload: { fileId: string; content: string }) => {
      setDrafts((current) => ({ ...current, [payload.fileId]: payload.content }));
      setStatus("Remote edit received");
    });
    socket.on("project:files-changed", () => void refreshFiles());
    socket.on("project:deleted", () => onBack());
    socket.on("chat:message", (chat: ChatMessage) => {
      setMessages((current) =>
        current.some((item) => item.id === chat.id) ? current : [...current, chat]
      );
    });
    socket.on("chat:typing", (payload: { name: string; typing: boolean }) => {
      setTypingUsers((current) =>
        payload.typing
          ? current.includes(payload.name)
            ? current
            : [...current, payload.name]
          : current.filter((name) => name !== payload.name)
      );
    });
    socket.on(
      "execution:log",
      (payload: { executionId: string; stream: string; text: string }) => {
        setPanel("console");
        setConsoleOutput((current) => `${current}${payload.text}`.slice(-250000));
      }
    );
    socket.on("execution:updated", (execution: Execution) => {
      setExecutions((current) => upsertById(current, execution));
      setPanel("console");
      if (execution.status !== "running") {
        setStatus(`Execution ${execution.status}`);
        void refreshMonitoring();
      }
    });
    socket.on("deployment:updated", (item: Deployment) => {
      setDeployment(item);
      setPanel("console");
      setStatus(`Deployment ${item.status}`);
      void refreshMonitoring();
    });
    socket.on("monitoring:updated", (item: MonitoringRecord) => {
      setMonitoring((current) => [item, ...current]);
    });
    socket.on("connect_error", (socketError) => {
      setError(`Collaboration connection failed: ${socketError.message}`);
    });

    return () => {
      socket.emit("project:leave", { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token]);

  useEffect(() => {
    if (!dirtyFileId) return;
    const file = files.find((item) => item.id === dirtyFileId);
    if (!file) return;
    const timer = window.setTimeout(() => {
      void saveFile(file, false);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [dirtyFileId, drafts, files]);

  useEffect(() => {
    function handleOnline() {
      void flushPendingSaves();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [files, drafts]);

  useEffect(() => {
    if (!activeExecution) return;
    const interval = window.setInterval(() => void refreshExecutions(), 2500);
    return () => window.clearInterval(interval);
  }, [activeExecution?.id]);

  async function loadProject() {
    setLoading(true);
    setError(null);
    try {
      const [projectData, fileData, chatData, monitoringData, executionData, deploymentData, versionData] =
        await Promise.all([
          apiData<Project>(`/api/projects/${projectId}`, { token }),
          apiData<WorkspaceFile[]>(`/api/files?projectId=${projectId}`, { token }),
          apiData<ChatMessage[]>(`/api/projects/${projectId}/chat?limit=50`, { token }),
          apiData<MonitoringRecord[]>(`/api/monitoring?projectId=${projectId}`, { token }),
          apiData<Execution[]>(`/api/projects/${projectId}/executions`, { token }),
          apiData<Deployment[]>(`/api/projects/${projectId}/deployments`, { token }),
          apiData<FileVersion[]>(`/api/projects/${projectId}/versions`, { token })
        ]);
      setProject(projectData);
      setFiles(fileData);
      setDrafts(Object.fromEntries(fileData.map((file) => [file.id, file.content || ""])));
      setOpenTabs(fileData.find((file) => file.type === "file") ? [fileData.find((file) => file.type === "file")!.id] : []);
      setActiveFileId(fileData.find((file) => file.type === "file")?.id || null);
      setMessages(chatData);
      setHasOlderMessages(chatData.length === 50);
      setMonitoring(monitoringData);
      setExecutions(executionData);
      setDeployment(deploymentData[0] || null);
      setVersions(versionData);
      setStatus(fileData.length ? "MongoDB synced" : "Create or import files to start");
      await apiFetch(`/api/projects/${projectId}/chat/read`, { method: "POST", token });
      await flushPendingSaves(fileData);
    } catch (loadError) {
      setError(errorMessage(loadError));
      setStatus("Project failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function refreshFiles() {
    try {
      const data = await apiData<WorkspaceFile[]>(`/api/files?projectId=${projectId}`, {
        token
      });
      setFiles(data);
      setDrafts((current) => ({
        ...Object.fromEntries(data.map((file) => [file.id, file.content || ""])),
        ...Object.fromEntries(
          Object.entries(current).filter(([id]) => dirtyFileId === id)
        )
      }));
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    }
  }

  async function refreshVersions() {
    const data = await apiData<FileVersion[]>(`/api/projects/${projectId}/versions`, {
      token
    });
    setVersions(data);
  }

  async function refreshMonitoring() {
    const data = await apiData<MonitoringRecord[]>(`/api/monitoring?projectId=${projectId}`, {
      token
    });
    setMonitoring(data);
  }

  async function refreshExecutions() {
    const data = await apiData<Execution[]>(`/api/projects/${projectId}/executions`, {
      token
    });
    setExecutions(data);
  }

  function openFile(file: WorkspaceFile) {
    if (file.type !== "file") return;
    setActiveFileId(file.id);
    setOpenTabs((current) =>
      current.includes(file.id) ? current : [...current, file.id]
    );
    socketRef.current?.emit("presence:file", {
      projectId,
      fileId: file.id,
      filePath: file.path,
      editing: false
    });
  }

  function createFile(folderPath = "/") {
    const name = window.prompt("File name", "index.ts");
    if (!name?.trim()) return;
    void createEntry(joinPath(folderPath, name.trim()), "file");
  }

  function createFolder(folderPath = "/") {
    const name = window.prompt("Folder name", "src");
    if (!name?.trim()) return;
    void createEntry(joinPath(folderPath, name.trim()), "folder");
  }

  async function createEntry(path: string, type: "file" | "folder") {
    setSaving(true);
    setError(null);
    try {
      const created =
        type === "folder"
          ? await apiData<WorkspaceFile>("/api/folders", {
            method: "POST",
            token,
            body: { projectId, path }
          })
          : await apiData<WorkspaceFile>("/api/files", {
            method: "POST",
            token,
            body: {
              projectId,
              path,
              content: "",
              language: languageFromPath(path),
              type: "file"
            }
          });
      setFiles((current) => upsertById(current, created));
      setDrafts((current) => ({ ...current, [created.id]: created.content || "" }));
      setExpandedPaths((current) => new Set([...current, parentPath(path)]));
      if (type === "file") openFile(created);
      setNotice(`${type === "folder" ? "Folder" : "File"} created.`);
      await refreshVersions();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function saveFile(
    file: WorkspaceFile | null = activeFile,
    explicit = true,
    override?: { content: string; revision: number; action?: string }
  ) {
    if (!file) return;
    setSaving(true);
    setError(null);
    socketRef.current?.emit("file:save-status", {
      projectId,
      fileId: file.id,
      status: "saving"
    });
    try {
      const content = override?.content ?? drafts[file.id] ?? file.content;
      const saved = await apiData<WorkspaceFile>(`/api/files/${file.id}`, {
        method: "PATCH",
        token,
        body: {
          expectedRevision: override?.revision ?? file.revision,
          content,
          language: file.language,
          action: override?.action
        }
      });
      setFiles((current) => upsertById(current, saved));
      setDrafts((current) => ({ ...current, [saved.id]: saved.content || "" }));
      setDirtyFileId((current) => (current === file.id ? null : current));
      removePendingSave(file.id);
      setStatus(explicit ? "Saved to MongoDB" : "Auto saved");
      socketRef.current?.emit("file:save-status", {
        projectId,
        fileId: file.id,
        status: "saved"
      });
      if (explicit) await refreshVersions();
      return saved;
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 409) {
        const serverFile = saveError.payload?.data as WorkspaceFile | undefined;
        if (serverFile) setConflict(serverFile);
        setStatus("Save conflict");
      } else if (!navigator.onLine || isNetworkError(saveError)) {
        queuePendingSave({
          fileId: file.id,
          content: override?.content ?? drafts[file.id] ?? file.content,
          revision: override?.revision ?? file.revision
        });
        setStatus("Saved offline; retry queued");
        setNotice("You are offline. This save will retry after reconnect.");
      } else {
        setError(errorMessage(saveError));
        setStatus("Save failed");
      }
      socketRef.current?.emit("file:save-status", {
        projectId,
        fileId: file.id,
        status: "error"
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function renameEntry(file: WorkspaceFile) {
    const nextPath = window.prompt("New path", file.path);
    if (!nextPath?.trim() || normalizePath(nextPath) === file.path) return;
    await updatePath(file, normalizePath(nextPath));
  }

  async function moveEntry(file: WorkspaceFile, destinationFolder: string) {
    if (
      file.type === "folder" &&
      (destinationFolder === file.path || destinationFolder.startsWith(`${file.path}/`))
    ) {
      setError("A folder cannot be moved inside itself.");
      return;
    }
    const nextPath = joinPath(destinationFolder, file.name);
    if (nextPath === file.path) return;
    await updatePath(file, nextPath);
  }

  async function updatePath(file: WorkspaceFile, path: string) {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiData<WorkspaceFile>(`/api/files/${file.id}`, {
        method: "PATCH",
        token,
        body: { path, expectedRevision: file.revision }
      });
      if (file.type === "folder") {
        await refreshFiles();
      } else {
        setFiles((current) => upsertById(current, updated));
        setOpenTabs((current) => current.map((id) => (id === file.id ? updated.id : id)));
      }
      await refreshVersions();
      setNotice("Entry moved successfully.");
    } catch (moveError) {
      setError(errorMessage(moveError));
    } finally {
      setSaving(false);
    }
  }

  async function duplicateEntry(file: WorkspaceFile) {
    setSaving(true);
    setError(null);
    try {
      await apiData<WorkspaceFile[]>(`/api/files/${file.id}/duplicate`, {
        method: "POST",
        token
      });
      await Promise.all([refreshFiles(), refreshVersions()]);
      setNotice("Entry duplicated.");
    } catch (duplicateError) {
      setError(errorMessage(duplicateError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(file: WorkspaceFile) {
    if (!window.confirm(`Delete ${file.path}${file.type === "folder" ? " and its contents" : ""}?`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch<ApiResponse<unknown>>(`/api/files/${file.id}`, {
        method: "DELETE",
        token
      });
      const removedPaths = new Set(
        files
          .filter((item) => item.path === file.path || item.path.startsWith(`${file.path}/`))
          .map((item) => item.id)
      );
      setFiles((current) => current.filter((item) => !removedPaths.has(item.id)));
      setOpenTabs((current) => current.filter((id) => !removedPaths.has(id)));
      if (activeFileId && removedPaths.has(activeFileId)) setActiveFileId(null);
      await refreshVersions();
      setNotice("Entry deleted. It can be restored from version history.");
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function importFiles(selected: File[]) {
    setImporting(true);
    setImportProgress(0);
    setError(null);
    try {
      const accepted: Array<{ path: string; content: string }> = [];
      const locallyRejected: string[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        const relativePath = normalizePath(file.webkitRelativePath || file.name);
        if (!isSupportedPath(relativePath)) {
          locallyRejected.push(relativePath);
        } else {
          accepted.push({ path: relativePath, content: await file.text() });
        }
        setImportProgress(Math.round(((index + 1) / Math.max(1, selected.length)) * 60));
      }
      if (!accepted.length) {
        throw new Error("No supported files were selected.");
      }
      const result = await apiData<ImportResult>("/api/files/import", {
        method: "POST",
        token,
        body: { projectId, files: accepted }
      });
      setImportProgress(100);
      await Promise.all([refreshFiles(), refreshVersions()]);
      setNotice(
        `Imported ${result.created.length} file${result.created.length === 1 ? "" : "s"}${result.rejected.length + locallyRejected.length
          ? `; ${result.rejected.length + locallyRejected.length} rejected`
          : ""
        }.`
      );
    } catch (importError) {
      setError(errorMessage(importError));
    } finally {
      window.setTimeout(() => setImportProgress(null), 800);
      setImporting(false);
    }
  }

  async function loadOlderMessages() {
    const oldest = messages[0]?.createdAt;
    if (!oldest) return;
    try {
      const older = await apiData<ChatMessage[]>(
        `/api/projects/${projectId}/chat?limit=50&before=${encodeURIComponent(oldest)}`,
        { token }
      );
      setMessages((current) => [...older, ...current]);
      setHasOlderMessages(older.length === 50);
    } catch (chatError) {
      setError(errorMessage(chatError));
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!message.trim()) return;
    try {
      const chat = await apiData<ChatMessage>("/api/chat", {
        method: "POST",
        token,
        body: { projectId, message: message.trim() }
      });
      setMessages((current) =>
        current.some((item) => item.id === chat.id) ? current : [...current, chat]
      );
      setMessage("");
      socketRef.current?.emit("chat:typing", { projectId, typing: false });
    } catch (chatError) {
      setError(errorMessage(chatError));
    }
  }

  function updateMessage(value: string) {
    setMessage(value);
    socketRef.current?.emit("chat:typing", { projectId, typing: Boolean(value.trim()) });
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("chat:typing", { projectId, typing: false });
    }, 1400);
  }

  async function runReview(analysisType: AIReview["analysisType"] = "file") {
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
          code: activeContent,
          analysisType
        }
      });
      setReview(result);
      setAssistantResult({ kind: `${humanize(analysisType || "file")} Review`, data: result });
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
          context: activeFile ? { filePath: activeFile.path, code: activeContent } : undefined
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

  async function previewAutoFix(issue?: unknown, file = activeFile) {
    if (!file) return;
    setAiLoading(true);
    setError(null);
    setPanel("ai");
    try {
      const result = await apiData<AutoFixPreview>("/api/ai/auto-fix", {
        method: "POST",
        token,
        body: {
          filePath: file.path,
          code: drafts[file.id] ?? file.content,
          issue: issue || review?.issues?.[0]
        }
      });
      setPendingFix(result);
      setAssistantResult({ kind: "Auto Fix Preview", data: result });
      openFile(file);
    } catch (fixError) {
      setError(errorMessage(fixError));
    } finally {
      setAiLoading(false);
    }
  }

  async function applyPendingFix() {
    if (!activeFile || !pendingFix?.fixedCode) return;
    const saved = await saveFile(activeFile, true, {
      content: pendingFix.fixedCode,
      revision: activeFile.revision,
      action: "ai-fix"
    });
    if (saved) {
      setPendingFix(null);
      setReview(null);
      await refreshVersions();
      setNotice("AI fix applied and versioned.");
    }
  }

  async function runProject() {
    setPanel("console");
    setConsoleOutput("");
    setError(null);
    try {
      const execution = await apiData<Execution>(`/api/projects/${projectId}/run`, {
        method: "POST",
        token
      });
      setExecutions((current) => upsertById(current, execution));
      setStatus("Project running");
    } catch (runError) {
      setError(errorMessage(runError));
    }
  }

  async function stopProject() {
    if (!activeExecution) return;
    try {
      const stopped = await apiData<Execution>(`/api/executions/${activeExecution.id}/stop`, {
        method: "POST",
        token
      });
      setExecutions((current) => upsertById(current, stopped));
      setStatus("Execution stopped");
    } catch (stopError) {
      setError(errorMessage(stopError));
    }
  }

  async function analyzeRuntimeError(execution: Execution) {
    const file =
      files.find((item) => execution.errorFile?.replace(/\\/g, "/").endsWith(item.path.replace(/^\//, ""))) ||
      activeFile;
    if (!file) {
      setError("The affected file could not be identified.");
      return;
    }
    await previewAutoFix(
      {
        title: "Runtime error",
        message: execution.stderr,
        filePath: file.path,
        line: execution.errorLine
      },
      file
    );
  }

  async function deployProject() {
    setPanel("console");
    setError(null);
    try {
      const item = await apiData<Deployment>(`/api/projects/${projectId}/deploy`, {
        method: "POST",
        token,
        body: { environment: "preview" }
      });
      setDeployment(item);
      setStatus("Deployment queued");
    } catch (deployError) {
      setError(errorMessage(deployError));
    }
  }

  async function restoreVersion(version: FileVersion) {
    if (!window.confirm(`Restore ${version.path} from ${formatDate(version.createdAt)}?`)) return;
    try {
      const file = await apiData<WorkspaceFile>(`/api/versions/${version.id}/restore`, {
        method: "POST",
        token
      });
      await Promise.all([refreshFiles(), refreshVersions()]);
      openFile(file);
      setNotice("Version restored.");
    } catch (restoreError) {
      setError(errorMessage(restoreError));
    }
  }

  async function exportProject() {
    setError(null);
    try {
      const response = await fetch(downloadUrl(`/api/projects/${projectId}/export`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Project export failed.");
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

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((event) => {
      if (!activeFile) return;
      socketRef.current?.emit("presence:file", {
        projectId,
        fileId: activeFile.id,
        filePath: activeFile.path,
        cursor: {
          lineNumber: event.position.lineNumber,
          column: event.position.column
        },
        editing: Boolean(dirtyFileId === activeFile.id)
      });
    });
  };

  async function flushPendingSaves(knownFiles = files) {
    const pending = readPendingSaves();
    if (!pending.length || !navigator.onLine) return;
    for (const item of pending) {
      const file = knownFiles.find((entry) => entry.id === item.fileId);
      if (file) await saveFile(file, false, { content: item.content, revision: item.revision });
    }
  }

  function readPendingSaves(): PendingSave[] {
    try {
      return JSON.parse(
        window.localStorage.getItem(`devwatch_pending_saves_${projectId}`) || "[]"
      ) as PendingSave[];
    } catch {
      return [];
    }
  }

  function queuePendingSave(item: PendingSave) {
    const pending = readPendingSaves().filter((entry) => entry.fileId !== item.fileId);
    pending.push(item);
    window.localStorage.setItem(
      `devwatch_pending_saves_${projectId}`,
      JSON.stringify(pending)
    );
  }

  function removePendingSave(fileId: string) {
    const pending = readPendingSaves().filter((entry) => entry.fileId !== fileId);
    window.localStorage.setItem(
      `devwatch_pending_saves_${projectId}`,
      JSON.stringify(pending)
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f7f8fb] text-neutral-950">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
        <input
          className="hidden"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files || []);
            if (selected.length) void importFiles(selected);
            event.target.value = "";
          }}
          ref={toolbarImportRef}
          type="file"
        />
        <IconButton label="Back to projects" onClick={onBack}>
          <ChevronLeft size={16} />
        </IconButton>
        <button
          className="mr-auto flex min-w-0 items-center gap-3 rounded-md px-2 py-1 text-left hover:bg-neutral-50"
          onClick={onDashboard}
          type="button"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-700 text-xs font-semibold text-white">
            DW
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{displayName}</span>
            <span className="block truncate text-xs text-neutral-500">{status}</span>
          </span>
        </button>
        <PresenceStrip presence={presence} />
        <div className="flex flex-wrap gap-1.5">
          <Button disabled={!activeFile || saving} onClick={() => void saveFile()}>
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            Save
          </Button>
          <Button disabled={importing} onClick={() => createFile("/")}>
            <FilePlus2 size={15} />
            New File
          </Button>
          <Button disabled={importing} onClick={() => toolbarImportRef.current?.click()}>
            {importing ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
            {importing ? `Importing ${importProgress ?? 0}%` : "Import Files"}
          </Button>
          {activeExecution ? (
            <>
              <Button onClick={stopProject} variant="danger">
                <Square size={15} />
                Stop
              </Button>
              <Button onClick={runProject}>
                <RefreshCw size={15} />
                Restart
              </Button>
            </>
          ) : (
            <Button onClick={runProject}>
              <Play size={15} />
              Run
            </Button>
          )}
          <Button onClick={deployProject}>
            <Rocket size={15} />
            Deploy
          </Button>
          <Button disabled={!activeFile || aiLoading} onClick={() => void runReview()}>
            <Bot size={15} />
            AI Review
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={15} />
            Invite
          </Button>
          <IconButton label="Export ZIP" onClick={exportProject}>
            <Download size={16} />
          </IconButton>
        </div>
      </header>

      {error ? <NoticeBar message={error} tone="error" onClose={() => setError(null)} /> : null}
      {notice ? <NoticeBar message={notice} tone="success" onClose={() => setNotice(null)} /> : null}

      <section className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_390px]">
        <aside className="hidden min-h-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <FileExplorer
            activeFileId={activeFileId}
            expandedPaths={expandedPaths}
            files={files}
            importing={importing}
            importProgress={importProgress}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onDelete={deleteEntry}
            onDuplicate={duplicateEntry}
            onExpandedPathsChange={setExpandedPaths}
            onImport={importFiles}
            onMove={moveEntry}
            onOpen={openFile}
            onRename={renameEntry}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col border-r border-neutral-200 bg-white">
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-2 pt-2">
            {tabs.map((file) => (
              <button
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-3 text-sm",
                  activeFileId === file.id
                    ? "border-neutral-200 bg-white text-neutral-950"
                    : "border-transparent text-neutral-500 hover:bg-white"
                )}
                key={file.id}
                onClick={() => openFile(file)}
                type="button"
              >
                <Code2 size={14} />
                {file.name}
                {dirtyFileId === file.id ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {loading ? (
              <CenteredMessage title="Loading project">Restoring files and collaboration state.</CenteredMessage>
            ) : activeFile ? (
              <MonacoEditor
                height="100%"
                language={activeFile.language}
                onChange={(value) => {
                  const content = value || "";
                  setDrafts((current) => ({ ...current, [activeFile.id]: content }));
                  setDirtyFileId(activeFile.id);
                  setStatus("Editing draft");
                  socketRef.current?.emit("file:change", {
                    projectId,
                    fileId: activeFile.id,
                    path: activeFile.path,
                    content,
                    revision: activeFile.revision
                  });
                  socketRef.current?.emit("presence:file", {
                    projectId,
                    fileId: activeFile.id,
                    filePath: activeFile.path,
                    editing: true
                  });
                }}
                onMount={handleEditorMount}
                options={{
                  automaticLayout: true,
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
              <CenteredMessage title="No file open">
                Create a file or import a folder from the Explorer.
              </CenteredMessage>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="grid grid-cols-5 border-b border-neutral-200 p-1.5">
            <InspectorTab active={panel === "ai"} icon={<Bot size={15} />} label="AI" onClick={() => setPanel("ai")} />
            <InspectorTab active={panel === "chat"} icon={<MessageSquare size={15} />} label="Chat" onClick={() => setPanel("chat")} />
            <InspectorTab active={panel === "monitoring"} icon={<Gauge size={15} />} label="Health" onClick={() => setPanel("monitoring")} />
            <InspectorTab active={panel === "console"} icon={<Code2 size={15} />} label="Output" onClick={() => setPanel("console")} />
            <InspectorTab active={panel === "history"} icon={<History size={15} />} label="History" onClick={() => setPanel("history")} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel === "ai" ? (
              <AIReviewPanel
                activeFile={activeFile}
                assistantQuestion={assistantQuestion}
                assistantResult={assistantResult}
                loading={aiLoading}
                pendingFix={pendingFix}
                review={review}
                setAssistantQuestion={setAssistantQuestion}
                applyPendingFix={applyPendingFix}
                askAssistant={askAssistant}
                previewAutoFix={() => void previewAutoFix()}
                runProjectAnalysis={runProjectAnalysis}
                runReview={runReview}
              />
            ) : null}
            {panel === "chat" ? (
              <ChatPanel
                currentUser={user}
                hasOlder={hasOlderMessages}
                message={message}
                messages={messages}
                typingUsers={typingUsers}
                loadOlder={loadOlderMessages}
                sendMessage={sendMessage}
                setMessage={updateMessage}
              />
            ) : null}
            {panel === "monitoring" ? <MonitorPanel records={monitoring} presence={presence} /> : null}
            {panel === "console" ? (
              <ConsolePanel
                consoleOutput={consoleOutput}
                deployment={deployment}
                executions={executions}
                onAnalyzeError={analyzeRuntimeError}
                onClear={() => setConsoleOutput("")}
                onRun={runProject}
              />
            ) : null}
            {panel === "history" ? <HistoryPanel versions={versions} onRestore={restoreVersion} /> : null}
          </div>
        </aside>
      </section>

      {inviteOpen && project ? (
        <InviteModal
          project={project}
          token={token}
          onClose={() => setInviteOpen(false)}
          onInvited={(message) => {
            setInviteOpen(false);
            setNotice(message);
          }}
        />
      ) : null}
      {conflict && activeFile ? (
        <ConflictModal
          file={activeFile}
          serverFile={conflict}
          onClose={() => setConflict(null)}
          onKeepServer={() => {
            setFiles((current) => upsertById(current, conflict));
            setDrafts((current) => ({ ...current, [conflict.id]: conflict.content }));
            setDirtyFileId(null);
            setConflict(null);
            setStatus("Server version loaded");
          }}
          onOverwrite={() => {
            void saveFile(activeFile, true, {
              content: drafts[activeFile.id] ?? activeFile.content,
              revision: conflict.revision
            });
            setConflict(null);
          }}
        />
      ) : null}
    </main>
  );
}

function AIReviewPanel({
  activeFile,
  assistantQuestion,
  assistantResult,
  applyPendingFix,
  askAssistant,
  loading,
  pendingFix,
  previewAutoFix,
  review,
  runProjectAnalysis,
  runReview,
  setAssistantQuestion
}: {
  activeFile: WorkspaceFile | null;
  assistantQuestion: string;
  assistantResult: AssistantResult | null;
  applyPendingFix: () => void;
  askAssistant: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  pendingFix: AutoFixPreview | null;
  previewAutoFix: () => void;
  review: AIReview | null;
  runProjectAnalysis: () => void;
  runReview: (type?: AIReview["analysisType"]) => void;
  setAssistantQuestion: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Groq AI Review</p>
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
        {review ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Score label="Quality" value={review.qualityScore} />
            <Score label="Security" value={review.securityScore} />
            <Score label="Performance" value={review.performanceScore} />
            <Score label="Maintainability" value={review.maintainabilityScore} />
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button disabled={!activeFile || loading} onClick={() => runReview("file")} variant="primary">
            <Bot size={15} />
            File
          </Button>
          <Button disabled={!activeFile || loading} onClick={() => runReview("security")}>
            Security
          </Button>
          <Button disabled={!activeFile || loading} onClick={() => runReview("performance")}>
            Performance
          </Button>
          <Button disabled={!activeFile || loading} onClick={() => runReview("maintainability")}>
            Maintainability
          </Button>
          <Button className="col-span-2" disabled={loading} onClick={runProjectAnalysis}>
            <Code2 size={15} />
            Full Project Analysis
          </Button>
          <Button
            className="col-span-2"
            disabled={!review?.issues?.length || loading}
            onClick={previewAutoFix}
          >
            <Wand2 size={15} />
            Preview Fix
          </Button>
        </div>
      </section>

      {pendingFix?.fixedCode ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-950">AI fix ready for confirmation</p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            {pendingFix.summary || "Review the structured result below before applying."}
          </p>
          <Button className="mt-3 w-full" onClick={applyPendingFix} variant="primary">
            <Wand2 size={15} />
            Apply Confirmed Fix
          </Button>
        </section>
      ) : null}

      <form className="rounded-lg border border-neutral-200 p-4" onSubmit={askAssistant}>
        <p className="text-sm font-semibold text-neutral-950">AI Chat Assistant</p>
        <textarea
          className="mt-3 min-h-24 w-full resize-none rounded-md border border-neutral-200 p-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setAssistantQuestion(event.target.value)}
          placeholder="Ask about this project or the open file"
          value={assistantQuestion}
        />
        <Button className="mt-3 w-full" disabled={loading || !assistantQuestion.trim()} type="submit">
          <Send size={15} />
          Ask Assistant
        </Button>
      </form>

      {review?.issues?.length ? (
        <div className="space-y-3">
          {review.issues.map((issue, index) => (
            <div className="rounded-lg border border-neutral-200 p-4" key={`${issue.title}-${index}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-amber-600" size={17} />
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
        <section className="rounded-lg border border-neutral-200 p-4">
          <p className="mb-4 text-sm font-semibold text-neutral-950">{assistantResult.kind}</p>
          <ChatFormatter data={assistantResult.data} onFollowUp={setAssistantQuestion} />
        </section>
      ) : (
        <EmptyState title="No AI result yet">
          Run a review, project analysis, or assistant question.
        </EmptyState>
      )}
    </div>
  );
}

function ChatPanel({
  currentUser,
  hasOlder,
  loadOlder,
  message,
  messages,
  sendMessage,
  setMessage,
  typingUsers
}: {
  currentUser: UserSession;
  hasOlder: boolean;
  loadOlder: () => void;
  message: string;
  messages: ChatMessage[];
  sendMessage: (event?: FormEvent<HTMLFormElement>) => void;
  setMessage: (value: string) => void;
  typingUsers: string[];
}) {
  return (
    <div className="flex min-h-full flex-col">
      {hasOlder ? (
        <button
          className="mb-3 rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          onClick={loadOlder}
          type="button"
        >
          Load older messages
        </button>
      ) : null}
      <div className="min-h-[360px] flex-1 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        {messages.length ? (
          messages.map((item) => (
            <div className="rounded-lg border border-neutral-200 bg-white p-3" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-950">
                  {senderName(item.sender, currentUser)}
                </p>
                <p className="text-xs text-neutral-400">{formatTime(item.createdAt)}</p>
              </div>
              <MarkdownMessage text={item.message} />
              <p className="mt-2 text-xs text-neutral-400">
                {item.readBy?.length ? `Read by ${item.readBy.length}` : "Delivered"}
              </p>
            </div>
          ))
        ) : (
          <EmptyState title="No chat messages">Send the first project message.</EmptyState>
        )}
      </div>
      {typingUsers.length ? (
        <p className="mt-2 text-xs text-neutral-500">{typingUsers.join(", ")} typing...</p>
      ) : null}
      <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message this project"
          value={message}
        />
        <IconButton label="Send message" type="submit">
          <Send size={15} />
        </IconButton>
      </form>
    </div>
  );
}

function MonitorPanel({
  presence,
  records
}: {
  presence: ProjectPresence[];
  records: MonitoringRecord[];
}) {
  const latest = records[0];
  if (!latest) {
    return (
      <EmptyState title="No monitoring data">
        Run or deploy the project to create real monitoring records.
      </EmptyState>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="CPU" value={`${latest.cpu}%`} />
        <Metric label="RAM" value={`${latest.ram}%`} />
        <Metric label="Latency" value={`${latest.latency}ms`} />
        <Metric label="Sessions" value={String(presence.length || latest.activeSessions || 0)} />
        <Metric label="Errors" value={String(latest.errorCount || 0)} />
        <Metric label="AI Requests" value={String(latest.aiRequests || 0)} />
      </div>
      <section className="rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-semibold text-neutral-950">History</p>
        <div className="mt-3 space-y-2">
          {records.slice(0, 15).map((record) => (
            <div className="flex items-center justify-between gap-3 text-sm" key={record.id}>
              <span className="text-neutral-700">{record.source || "manual"}</span>
              <span className="text-neutral-500">{formatDate(record.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConsolePanel({
  consoleOutput,
  deployment,
  executions,
  onAnalyzeError,
  onClear,
  onRun
}: {
  consoleOutput: string;
  deployment: Deployment | null;
  executions: Execution[];
  onAnalyzeError: (execution: Execution) => void;
  onClear: () => void;
  onRun: () => void;
}) {
  const latest = executions[0];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-950">Execution Output</p>
          <p className="mt-1 text-xs text-neutral-500">
            {latest ? `${latest.runtime || "runtime"} · ${latest.status}` : "No execution yet"}
          </p>
        </div>
        <button className="text-xs font-medium text-neutral-600 hover:text-neutral-950" onClick={onClear} type="button">
          Clear
        </button>
      </div>
      <pre className="min-h-56 max-h-[420px] overflow-auto rounded-lg bg-neutral-950 p-4 text-xs leading-5 text-neutral-100">
        {consoleOutput || latest?.stdout || latest?.stderr || "Run the project to stream stdout and stderr."}
      </pre>
      {latest && ["failed", "timed-out"].includes(latest.status) ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-950">This project contains errors.</p>
          <p className="mt-2 text-sm leading-6 text-rose-900">
            Would you like AI to analyze and prepare a fix for confirmation?
          </p>
          <Button className="mt-3" onClick={() => onAnalyzeError(latest)}>
            <Bot size={15} />
            Analyze with AI
          </Button>
        </section>
      ) : null}
      <Button className="w-full" onClick={onRun}>
        <RefreshCw size={15} />
        Run Again
      </Button>
      {deployment ? (
        <section className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-950">Deployment</p>
            <span className="text-xs font-semibold text-neutral-600">{deployment.status}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-md bg-neutral-100">
            <div className="h-full bg-indigo-700" style={{ width: `${deployment.progress || 0}%` }} />
          </div>
          <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-neutral-50 p-3 text-xs leading-5 text-neutral-700">
            {deployment.logs || "Waiting for deployment logs."}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function HistoryPanel({
  onRestore,
  versions
}: {
  onRestore: (version: FileVersion) => void;
  versions: FileVersion[];
}) {
  if (!versions.length) {
    return (
      <EmptyState title="No version history">
        Saves, renames, deletes, imports, restores, and AI fixes will appear here.
      </EmptyState>
    );
  }
  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <section className="rounded-lg border border-neutral-200 p-4" key={version.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-950">{version.path}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {humanize(version.action)} · revision {version.revision} · {formatDate(version.createdAt)}
              </p>
            </div>
            <button
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              onClick={() => onRestore(version)}
              type="button"
            >
              Restore
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

function InviteModal({
  onClose,
  onInvited,
  project,
  token
}: {
  onClose: () => void;
  onInvited: (message: string) => void;
  project: Project;
  token: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("developer");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await apiData("/api/invites", {
        method: "POST",
        token,
        body: { workspaceId: project.workspaceId, projectId: project.id, email, role }
      });
      onInvited(`Invitation sent to ${email}.`);
    } catch (inviteError) {
      setError(errorMessage(inviteError));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title="Invite Collaborator" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">Email address</span>
          <input
            className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">Role</span>
          <select
            className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none"
            onChange={(event) => setRole(event.target.value)}
            value={role}
          >
            <option value="developer">Developer</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <Button className="w-full" disabled={sending || !email.trim()} type="submit" variant="primary">
          {sending ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />}
          Send Secure Invitation
        </Button>
      </form>
    </Modal>
  );
}

function ConflictModal({
  file,
  onClose,
  onKeepServer,
  onOverwrite,
  serverFile
}: {
  file: WorkspaceFile;
  onClose: () => void;
  onKeepServer: () => void;
  onOverwrite: () => void;
  serverFile: WorkspaceFile;
}) {
  return (
    <Modal title="Save Conflict Detected" onClose={onClose}>
      <p className="text-sm leading-6 text-neutral-700">
        {file.path} changed on another client. The server is at revision {serverFile.revision},
        while your editor started from revision {file.revision}.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onKeepServer}>Use Server Version</Button>
        <Button onClick={onOverwrite} variant="danger">Overwrite With Mine</Button>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PresenceStrip({ presence }: { presence: ProjectPresence[] }) {
  if (!presence.length) return null;
  return (
    <div className="hidden items-center gap-1.5 border-r border-neutral-200 pr-2 xl:flex">
      {presence.slice(0, 5).map((entry) => (
        <span
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-indigo-50 text-xs font-semibold text-indigo-800"
          key={entry.socketId}
          title={`${entry.name}${entry.filePath ? ` → ${entry.filePath}` : ""}`}
        >
          {entry.photoURL ? (
            <img alt={entry.name} className="h-full w-full object-cover" src={entry.photoURL} />
          ) : (
            initials(entry.name)
          )}
        </span>
      ))}
      <Users className="ml-1 text-neutral-500" size={15} />
    </div>
  );
}

function Typewriter({ text, speed = 10 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

function ChatFormatter({ data, onFollowUp }: { data: any; onFollowUp: (q: string) => void }) {
  if (typeof data !== "object" || !data) {
    return <Typewriter text={String(data)} speed={15} />;
  }

  if (data.answer) {
    return (
      <div className="space-y-4 text-sm text-neutral-800">
        <div className="leading-6">
          <Typewriter text={data.answer} speed={10} />
        </div>
        {data.bullets && data.bullets.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 text-neutral-700">
            {data.bullets.map((bullet: string, i: number) => (
              <li key={i}>
                <Typewriter text={bullet} speed={10} />
              </li>
            ))}
          </ul>
        )}
        {data.referencedFiles && data.referencedFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.referencedFiles.map((file: string, i: number) => (
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200" key={i}>
                <Typewriter text={file} speed={20} />
              </span>
            ))}
          </div>
        )}
        {data.followUps && data.followUps.length > 0 && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-neutral-500">Suggested Follow-ups</p>
            <div className="flex flex-col gap-2">
              {data.followUps.map((q: string, i: number) => (
                <button
                  className="rounded-md border border-indigo-100/50 bg-indigo-50/50 px-3 py-2 text-left text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-800"
                  key={i}
                  onClick={() => onFollowUp(q)}
                  type="button"
                >
                  <Typewriter text={q} speed={15} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-neutral-950 p-3 text-xs leading-5 text-neutral-100">
      <Typewriter text={JSON.stringify(data, null, 2)} speed={5} />
    </pre>
  );
}

function MarkdownMessage({ text }: { text: string }) {
  const parts = text.split(/```/);
  return (
    <div className="mt-2 space-y-2 text-sm leading-6 text-neutral-700">
      {parts.map((part, index) =>
        index % 2 ? (
          <pre className="overflow-auto rounded-md bg-neutral-950 p-3 text-xs text-neutral-100" key={`${part}-${index}`}>
            <code>{part.replace(/^[a-z]+\n/i, "")}</code>
          </pre>
        ) : (
          <p className="whitespace-pre-wrap" key={`${part}-${index}`}>{part}</p>
        )
      )}
    </div>
  );
}

function NoticeBar({
  message,
  onClose,
  tone
}: {
  message: string;
  onClose: () => void;
  tone: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 text-sm",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      )}
    >
      <span>{message}</span>
      <button aria-label="Close message" onClick={onClose} type="button"><X size={15} /></button>
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
        "flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium",
        active ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-50"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function CenteredMessage({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState title={title}>{children}</EmptyState>
    </div>
  );
}

function EmptyState({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{children}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">{value ?? 0}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const exists = items.some((current) => current.id === item.id);
  return exists
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

function joinPath(folderPath: string, name: string) {
  return normalizePath(`${folderPath}/${name}`);
}

function normalizePath(value: string) {
  const segments = String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== "..");
  return `/${segments.join("/")}`;
}

function parentPath(value: string) {
  const segments = normalizePath(value).split("/").filter(Boolean);
  segments.pop();
  return segments.length ? `/${segments.join("/")}` : "/";
}

function languageFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  const languages: Record<string, string> = {
    c: "c",
    cpp: "cpp",
    css: "css",
    env: "dotenv",
    go: "go",
    html: "html",
    java: "java",
    js: "javascript",
    json: "json",
    jsx: "javascript",
    md: "markdown",
    py: "python",
    rs: "rust",
    ts: "typescript",
    tsx: "typescript",
    txt: "plaintext",
    yaml: "yaml",
    yml: "yaml"
  };
  return extension ? languages[extension] || "plaintext" : "plaintext";
}

function isSupportedPath(path: string) {
  if (path.toLowerCase().endsWith("/.env") || path.toLowerCase() === "/.env") return true;
  const extension = path.split(".").pop()?.toLowerCase();
  return Boolean(extension && supportedExtensions.has(extension));
}

function senderName(sender: ChatMessage["sender"], currentUser: UserSession) {
  if (sender && typeof sender === "object") {
    return sender.name || sender.email || "Team member";
  }
  if (sender === currentUser.id || sender === currentUser.uid) return currentUser.name;
  return "Team member";
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value)
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function humanize(value: string) {
  return value
    .split(/[-_.]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError || errorMessage(error).toLowerCase().includes("fetch");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
