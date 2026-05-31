const express = require("express");
const mongoose = require("mongoose");
const { Member, Project, Workspace } = require("../models");
const { requireAuth } = require("../middleware/auth");
const {
  aiAutoFix,
  aiBugDetection,
  aiChatAssistant,
  aiCodeReview,
  aiCodeSuggestions,
  aiProjectAnalysis
} = require("../services/aiService");

const router = express.Router();

router.use(requireAuth);

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function requireString(value, fieldName) {
  if (!value || typeof value !== "string") {
    const error = new Error(`${fieldName} is required.`);
    error.status = 400;
    throw error;
  }

  return value;
}

function optionalObjectId(value, fieldName) {
  if (!value) return undefined;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`${fieldName} must be a valid ObjectId.`);
    error.status = 400;
    throw error;
  }

  return value;
}

async function ensureProjectAccess(userId, projectId) {
  if (!projectId) return null;

  const project = await Project.findById(projectId).select("workspaceId");
  if (!project) {
    const error = new Error("Project not found.");
    error.status = 404;
    throw error;
  }

  const [workspace, member] = await Promise.all([
    Workspace.findById(project.workspaceId).select("ownerId"),
    Member.findOne({
      workspaceId: project.workspaceId,
      userId,
      status: "active"
    })
  ]);

  if (String(workspace?.ownerId) !== String(userId) && !member) {
    const error = new Error("You do not have access to this project.");
    error.status = 403;
    throw error;
  }

  return project;
}

router.post(
  "/review",
  asyncHandler(async (request, response) => {
    const projectId = optionalObjectId(request.body.projectId, "projectId");
    await ensureProjectAccess(request.user._id, projectId);
    const result = await aiCodeReview({
      projectId,
      fileId: optionalObjectId(request.body.fileId, "fileId"),
      requestedBy: request.user._id,
      filePath: request.body.filePath,
      code: request.body.code
    });

    response.status(200).json({
      success: true,
      type: "code_review",
      data: result
    });
  })
);

router.post(
  "/suggestions",
  asyncHandler(async (request, response) => {
    const result = await aiCodeSuggestions({
      filePath: request.body.filePath,
      code: requireString(request.body.code, "code"),
      context: request.body.context
    });

    response.status(200).json({
      success: true,
      type: "code_suggestions",
      data: result
    });
  })
);

router.post(
  "/bug-detection",
  asyncHandler(async (request, response) => {
    const result = await aiBugDetection({
      filePath: request.body.filePath,
      code: requireString(request.body.code, "code"),
      context: request.body.context
    });

    response.status(200).json({
      success: true,
      type: "bug_detection",
      data: result
    });
  })
);

router.post(
  "/auto-fix",
  asyncHandler(async (request, response) => {
    const result = await aiAutoFix({
      filePath: request.body.filePath,
      code: requireString(request.body.code, "code"),
      issue: request.body.issue
    });

    response.status(200).json({
      success: true,
      type: "auto_fix",
      data: result
    });
  })
);

router.post(
  "/chat",
  asyncHandler(async (request, response) => {
    const result = await aiChatAssistant({
      projectId: request.body.projectId,
      question: requireString(request.body.question, "question"),
      context: request.body.context
    });

    response.status(200).json({
      success: true,
      type: "chat_assistant",
      data: result
    });
  })
);

router.post(
  "/project-analysis",
  asyncHandler(async (request, response) => {
    const projectId = requireString(request.body.projectId, "projectId");
    await ensureProjectAccess(request.user._id, projectId);
    const result = await aiProjectAnalysis({
      projectId,
      requestedBy: request.user._id
    });

    response.status(200).json({
      success: true,
      type: "project_analysis",
      data: result
    });
  })
);

router.post("/fix", (request, response, next) => {
  request.url = "/auto-fix";
  router.handle(request, response, next);
});

router.post("/bugs", (request, response, next) => {
  request.url = "/bug-detection";
  router.handle(request, response, next);
});

router.post("/analyze", (request, response, next) => {
  request.url = "/project-analysis";
  router.handle(request, response, next);
});

module.exports = router;
