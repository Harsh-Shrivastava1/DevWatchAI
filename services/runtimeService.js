const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const {
  Activity,
  Execution,
  Monitoring
} = require("../models");

const activeExecutions = new Map();
const MAX_OUTPUT = 250000;
const DEFAULT_TIMEOUT_MS = 30000;

async function startExecution({ project, userId, files, io }) {
  const execution = await Execution.create({
    workspaceId: project.workspaceId,
    projectId: project._id,
    triggeredBy: userId,
    status: "queued"
  });

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "devwatch-run-"));
  let runner;
  try {
    await writeProjectFiles(tempDirectory, files);
    runner = selectRunner(files, tempDirectory);
  } catch (error) {
    execution.status = "failed";
    execution.stderr = error.stack || error.message;
    execution.finishedAt = new Date();
    await execution.save();
    await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => { });
    emit(io, project._id, "execution:updated", serializeExecution(execution));
    throw error;
  }

  execution.status = "running";
  execution.runtime = runner.runtime;
  execution.entryFile = runner.entryPath;
  execution.startedAt = new Date();
  await execution.save();

  emit(io, project._id, "execution:updated", serializeExecution(execution));

  const child = spawn(runner.command, runner.args, {
    cwd: tempDirectory,
    env: {
      NODE_ENV: "development",
      PATH: process.env.PATH || "",
      PYTHONIOENCODING: "utf-8"
    },
    shell: false,
    windowsHide: true
  });
  const startedAt = Date.now();
  activeExecutions.set(String(execution._id), {
    child,
    projectId: String(project._id),
    tempDirectory
  });

  const timeout = setTimeout(() => {
    if (!child.killed) child.kill();
    execution.status = "timed-out";
  }, Number(process.env.EXECUTION_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  child.stdout.on("data", (chunk) => {
    execution.stdout = appendOutput(execution.stdout, chunk.toString());
    emit(io, project._id, "execution:log", {
      executionId: String(execution._id),
      stream: "stdout",
      text: chunk.toString()
    });
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    execution.stderr = appendOutput(execution.stderr, text);
    const location = parseErrorLocation(text);
    if (location) {
      execution.errorFile = location.file;
      execution.errorLine = location.line;
    }
    emit(io, project._id, "execution:log", {
      executionId: String(execution._id),
      stream: "stderr",
      text
    });
  });

  child.on("error", async (error) => {
    execution.stderr = appendOutput(execution.stderr, error.stack || error.message);
    execution.status = "failed";
    await finalizeExecution({ execution, project, io, startedAt, tempDirectory });
  });

  child.on("close", async (code, signal) => {
    clearTimeout(timeout);
    if (execution.status === "running") {
      execution.status = code === 0 ? "success" : "failed";
    }
    execution.exitCode = code;
    execution.signal = signal;
    await finalizeExecution({ execution, project, io, startedAt, tempDirectory });
  });

  return execution;
}

async function stopExecution(executionId) {
  const active = activeExecutions.get(String(executionId));
  if (!active) return false;
  active.child.kill();
  return true;
}

function getActiveExecutionCount(projectId) {
  return [...activeExecutions.values()].filter(
    (execution) => execution.projectId === String(projectId)
  ).length;
}

async function finalizeExecution({ execution, project, io, startedAt, tempDirectory }) {
  if (execution.finishedAt) return;
  execution.finishedAt = new Date();
  execution.durationMs = Date.now() - startedAt;
  await execution.save();
  activeExecutions.delete(String(execution._id));
  await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => { });

  await Promise.all([
    Activity.create({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: execution.triggeredBy,
      action: `execution.${execution.status}`,
      targetType: "project",
      targetId: project._id,
      metadata: {
        executionId: execution._id,
        durationMs: execution.durationMs,
        exitCode: execution.exitCode
      }
    }),
    Monitoring.create({
      projectId: project._id,
      cpu: Math.min(100, Math.round(process.cpuUsage().user / 1000000)),
      ram: Math.min(100, Math.round((process.memoryUsage().rss / os.totalmem()) * 100)),
      latency: execution.durationMs,
      apiLatency: execution.durationMs,
      activeSessions: getActiveExecutionCount(project._id),
      errorCount: execution.status === "success" ? 0 : 1,
      status: execution.status === "success" ? "healthy" : "critical",
      source: "runtime",
      alerts:
        execution.status === "success"
          ? []
          : [
            {
              type: "runtime",
              message: execution.stderr.slice(0, 1000) || "Execution failed.",
              severity: "high"
            }
          ]
    })
  ]);

  emit(io, project._id, "execution:updated", serializeExecution(execution));
}

async function writeProjectFiles(directory, files) {
  for (const file of files) {
    if (file.type !== "file") continue;
    const relative = safeRelativePath(file.path);
    const target = path.join(directory, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content || "", "utf8");
  }
}

function selectRunner(files, directory) {
  const filePaths = new Set(files.filter((file) => file.type === "file").map((file) => file.path));
  let entry = resolvePackageEntry(files, filePaths);

  if (!entry) {
    const preferred = [
      "/src/index.ts",
      "/src/index.tsx",
      "/src/index.js",
      "/index.ts",
      "/index.js",
      "/main.py",
      "/src/main.py"
    ];
    entry = preferred.find((candidate) => filePaths.has(candidate));
  }

  if (!entry) {
    entry = files.find((file) => /\.(mjs|cjs|js|jsx|ts|tsx|py)$/i.test(file.path))?.path;
  }

  if (!entry) {
    const error = new Error("No runnable JavaScript, TypeScript, or Python entry file was found.");
    error.status = 422;
    throw error;
  }

  const entryPath = safeRelativePath(entry);
  const extension = path.extname(entry).toLowerCase();
  if ([".js", ".mjs", ".cjs"].includes(extension)) {
    return { command: process.execPath, args: [entryPath], runtime: "node", entryPath: entry };
  }
  if ([".ts", ".tsx", ".jsx"].includes(extension)) {
    let cli;
    try {
      cli = require.resolve("tsx/cli");
    } catch {
      const error = new Error("TypeScript runtime is unavailable on this server.");
      error.status = 503;
      throw error;
    }
    return {
      command: process.execPath,
      args: [cli, entryPath],
      runtime: "tsx",
      entryPath: entry
    };
  }
  if (extension === ".py") {
    return {
      command: process.env.PYTHON_COMMAND || "python",
      args: [entryPath],
      runtime: "python",
      entryPath: entry
    };
  }

  const error = new Error(`Runtime for ${extension} is not configured.`);
  error.status = 422;
  throw error;
}

function resolvePackageEntry(files, filePaths) {
  const packageFile = files.find((file) => file.path === "/package.json");
  if (!packageFile) return null;
  try {
    const packageJson = JSON.parse(packageFile.content || "{}");
    const main = packageJson.main ? `/${String(packageJson.main).replace(/^\/+/, "")}` : null;
    return main && filePaths.has(main) ? main : null;
  } catch {
    return null;
  }
}

function safeRelativePath(value) {
  const normalized = String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === "..")) {
    throw new Error("Unsafe project file path.");
  }
  return segments.join(path.sep);
}

function appendOutput(current, next) {
  return `${current || ""}${next}`.slice(-MAX_OUTPUT);
}

function parseErrorLocation(text) {
  const match = text.match(/(?:file:\/\/\/)?([A-Za-z]:[\\/][^:\n]+|\/[^:\n]+|[\w./\\-]+\.(?:js|jsx|ts|tsx|py)):(\d+)/);
  if (!match) return null;
  return {
    file: match[1].replace(/\\/g, "/"),
    line: Number(match[2])
  };
}

function emit(io, projectId, event, payload) {
  if (io) io.to(`project:${projectId}`).emit(event, payload);
}

function serializeExecution(execution) {
  const value = execution.toObject ? execution.toObject() : execution;
  return { ...value, id: String(value._id) };
}

module.exports = {
  activeExecutions,
  getActiveExecutionCount,
  startExecution,
  stopExecution
};
