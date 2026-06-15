const mongoose = require("mongoose");
const { AIReview, File, Project, Activity, Monitoring } = require("../models");
const { GROQ_MODEL, createGroqChatCompletion } = require("./groqClient");

function systemPrompt(kind) {
  return [
    "You are DevWatchAI, an AI assistant inside a collaborative cloud IDE.",
    "Return only valid JSON. No markdown, no prose outside JSON.",
    `Task type: ${kind}.`,
    "Use concise, production-grade engineering judgment.",
    "If evidence is missing, say so inside JSON fields instead of inventing facts."
  ].join(" ");
}

function normalizeIssues(issues = []) {
  return issues.map((issue) => ({
    type: issue.type || "Clean Code",
    severity: issue.severity || "Medium",
    title: issue.title || "Review item",
    message: issue.message || issue.description || "",
    filePath: issue.filePath || issue.file || "",
    line: issue.line || undefined,
    column: issue.column || undefined,
    suggestion: issue.suggestion || "",
    status: issue.status || "open"
  }));
}

function normalizeScore(score) {
  const parsed = Number(score);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

async function resolveCode({ code, fileId }) {
  if (code) return code;
  if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) return "";

  const file = await File.findById(fileId).lean();
  return file?.content || "";
}

async function writeActivity({ projectId, actorId, action, targetType, metadata }) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return;

  const project = await Project.findById(projectId).select("workspaceId").lean();
  if (!project?.workspaceId) return;

  await Activity.create({
    workspaceId: project.workspaceId,
    projectId,
    actorId,
    action,
    targetType,
    metadata
  });
}

async function storeReview({
  projectId,
  fileId,
  requestedBy,
  result,
  rawResponse,
  action = "ai.review.created",
  analysisType = "file"
}) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return null;
  }

  const review = await AIReview.create({
    projectId,
    fileId: mongoose.Types.ObjectId.isValid(fileId) ? fileId : undefined,
    requestedBy: mongoose.Types.ObjectId.isValid(requestedBy)
      ? requestedBy
      : undefined,
    score: normalizeScore(result.score),
    qualityScore: normalizeScore(result.qualityScore ?? result.score),
    maintainabilityScore: normalizeScore(result.maintainabilityScore ?? result.score),
    securityScore: normalizeScore(result.securityScore ?? result.score),
    performanceScore: normalizeScore(result.performanceScore ?? result.score),
    bugCount: Number(result.bugCount ?? result.issues?.filter((issue) => issue.type === "Bug").length ?? 0),
    complexityEstimate: result.complexityEstimate || "",
    analysisType,
    summary: result.summary || "",
    issues: normalizeIssues(result.issues),
    model: GROQ_MODEL,
    rawResponse
  });

  await Project.findByIdAndUpdate(projectId, {
    $set: {
      aiScore: review.score,
      status: review.score >= 80 ? "Reviewing" : "Warning"
    }
  });

  await writeActivity({
    projectId,
    actorId: requestedBy,
    action,
    targetType: "ai-review",
    metadata: {
      reviewId: review._id,
      score: review.score,
      issueCount: review.issues.length
    }
  });

  await Monitoring.create({
    projectId,
    aiRequests: 1,
    status: "healthy",
    source: "api"
  });

  return review;
}

async function aiCodeReview({
  projectId,
  fileId,
  filePath,
  code,
  requestedBy,
  analysisType = "file"
}) {
  const source = await resolveCode({ code, fileId });
  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("AI code review")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            score: "number 0-100",
            qualityScore: "number 0-100",
            maintainabilityScore: "number 0-100",
            securityScore: "number 0-100",
            performanceScore: "number 0-100",
            bugCount: "number",
            complexityEstimate: "string",
            summary: "string",
            issues:
              "array of {type: Bug|Security|Performance|Clean Code, severity: Low|Medium|High, title, message, filePath, line, column, suggestion}",
            positives: "array of strings",
            nextActions: "array of strings"
          },
          analysisType,
          filePath,
          code: source
        })
      }
    ]
  });

  const result = {
    score: normalizeScore(completion.json.score),
    qualityScore: normalizeScore(completion.json.qualityScore ?? completion.json.score),
    maintainabilityScore: normalizeScore(
      completion.json.maintainabilityScore ?? completion.json.score
    ),
    securityScore: normalizeScore(completion.json.securityScore ?? completion.json.score),
    performanceScore: normalizeScore(
      completion.json.performanceScore ?? completion.json.score
    ),
    bugCount: Number(completion.json.bugCount || 0),
    complexityEstimate: completion.json.complexityEstimate || "",
    summary: completion.json.summary || "",
    issues: normalizeIssues(completion.json.issues),
    positives: completion.json.positives || [],
    nextActions: completion.json.nextActions || [],
    model: completion.model,
    usage: completion.usage
  };

  const savedReview = await storeReview({
    projectId,
    fileId,
    requestedBy,
    result,
    rawResponse: completion.raw,
    analysisType
  });

  return {
    ...result,
    reviewId: savedReview?._id || null
  };
}

async function aiCodeSuggestions({ filePath, code, context }) {
  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("AI code suggestions")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            summary: "string",
            suggestions:
              "array of {title, reason, impact: Low|Medium|High, filePath, line, suggestedChange}",
            refactorPlan: "array of strings"
          },
          filePath,
          context,
          code
        })
      }
    ]
  });

  return {
    summary: completion.json.summary || "",
    suggestions: completion.json.suggestions || [],
    refactorPlan: completion.json.refactorPlan || [],
    model: completion.model,
    usage: completion.usage
  };
}

async function aiBugDetection({ filePath, code, context }) {
  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("AI bug detection")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            summary: "string",
            bugs:
              "array of {title, severity: Low|Medium|High, likelihood: Low|Medium|High, filePath, line, rootCause, reproduction, fix}",
            testsToAdd: "array of strings"
          },
          filePath,
          context,
          code
        })
      }
    ],
    temperature: 0.1
  });

  return {
    summary: completion.json.summary || "",
    bugs: completion.json.bugs || [],
    testsToAdd: completion.json.testsToAdd || [],
    model: completion.model,
    usage: completion.usage
  };
}

async function aiAutoFix({ filePath, code, issue }) {
  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("AI auto-fix")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            summary: "string",
            fixedCode: "string",
            changes: "array of strings",
            risks: "array of strings",
            testsToRun: "array of strings"
          },
          filePath,
          issue,
          code
        })
      }
    ],
    temperature: 0.1,
    maxTokens: 8192
  });

  return {
    summary: completion.json.summary || "",
    fixedCode: completion.json.fixedCode || code,
    changes: completion.json.changes || [],
    risks: completion.json.risks || [],
    testsToRun: completion.json.testsToRun || [],
    model: completion.model,
    usage: completion.usage
  };
}

async function aiChatAssistant({ question, context, projectId }) {
  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("AI chat assistant")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            answer: "string",
            bullets: "array of strings",
            referencedFiles: "array of strings",
            followUps: "array of strings"
          },
          projectId,
          context,
          question
        })
      }
    ]
  });

  return {
    answer: completion.json.answer || "",
    bullets: completion.json.bullets || [],
    referencedFiles: completion.json.referencedFiles || [],
    followUps: completion.json.followUps || [],
    model: completion.model,
    usage: completion.usage
  };
}

async function aiProjectAnalysis({ projectId, requestedBy }) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Valid projectId is required for project analysis.");
  }

  const [project, files] = await Promise.all([
    Project.findById(projectId).lean(),
    File.find({ projectId, type: "file" })
      .select("path language content updatedAt")
      .sort({ path: 1 })
      .limit(80)
      .lean()
  ]);

  if (!project) {
    const error = new Error("Project not found.");
    error.status = 404;
    throw error;
  }

  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: "system",
        content: systemPrompt("full project analysis")
      },
      {
        role: "user",
        content: JSON.stringify({
          expected_schema: {
            score: "number 0-100",
            qualityScore: "number 0-100",
            maintainabilityScore: "number 0-100",
            securityScore: "number 0-100",
            performanceScore: "number 0-100",
            bugCount: "number",
            complexityEstimate: "string",
            summary: "string",
            architecture: "object with strengths and risks arrays",
            issues:
              "array of {type: Bug|Security|Performance|Clean Code, severity: Low|Medium|High, title, message, filePath, suggestion}",
            priorities: "array of strings",
            recommendedTests: "array of strings"
          },
          project: {
            name: project.projectName,
            description: project.description,
            status: project.status
          },
          files: files.map((file) => ({
            path: file.path,
            language: file.language,
            updatedAt: file.updatedAt,
            content: file.content.slice(0, 12000)
          }))
        })
      }
    ],
    maxTokens: 8192
  });

  const result = {
    score: normalizeScore(completion.json.score),
    qualityScore: normalizeScore(completion.json.qualityScore ?? completion.json.score),
    maintainabilityScore: normalizeScore(
      completion.json.maintainabilityScore ?? completion.json.score
    ),
    securityScore: normalizeScore(completion.json.securityScore ?? completion.json.score),
    performanceScore: normalizeScore(
      completion.json.performanceScore ?? completion.json.score
    ),
    bugCount: Number(completion.json.bugCount || 0),
    complexityEstimate: completion.json.complexityEstimate || "",
    summary: completion.json.summary || "",
    architecture: completion.json.architecture || {
      strengths: [],
      risks: []
    },
    issues: normalizeIssues(completion.json.issues),
    priorities: completion.json.priorities || [],
    recommendedTests: completion.json.recommendedTests || [],
    model: completion.model,
    usage: completion.usage
  };

  const savedReview = await storeReview({
    projectId,
    requestedBy,
    result,
    rawResponse: completion.raw,
    action: "ai.project_analysis.created",
    analysisType: "project"
  });

  return {
    ...result,
    reviewId: savedReview?._id || null
  };
}

module.exports = {
  aiCodeReview,
  aiCodeSuggestions,
  aiBugDetection,
  aiAutoFix,
  aiChatAssistant,
  aiProjectAnalysis
};
