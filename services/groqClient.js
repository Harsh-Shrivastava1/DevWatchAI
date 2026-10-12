const Groq = require("groq-sdk");

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

function getGroqModel() {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

const GROQ_MODEL = getGroqModel();

let client;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error("GROQ_API_KEY is missing. Add it to your .env file.");
    err.status = 401;
    err.code = "missing_api_key";
    throw err;
  }

  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  return client;
}

function extractJson(content) {
  if (!content || typeof content !== "string") {
    throw new Error("Groq response did not include JSON content.");
  }

  const cleaned = content.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {}
    }

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq response was not valid JSON.");
    }

    return JSON.parse(match[0]);
  }
}

function formatGroqError(error, requestedModel) {
  const modelName = requestedModel || getGroqModel();
  const status = error.status || error.statusCode || 500;
  const rawMessage = typeof error.message === "string" ? error.message : "";

  let providerCode = error.code || "";
  let providerType = error.type || "";
  let providerMessage = "";

  try {
    const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error) {
        providerCode = parsed.error.code || providerCode;
        providerType = parsed.error.type || providerType;
        providerMessage = parsed.error.message || "";
      }
    }
  } catch {}

  const combinedDetails = `${rawMessage} ${providerMessage}`.toLowerCase();

  let friendlyMessage = "An unexpected error occurred while communicating with the AI service.";
  let httpStatus = status;

  if (
    status === 404 ||
    providerCode === "model_not_found" ||
    combinedDetails.includes("model_not_found") ||
    combinedDetails.includes("does not exist or you do not have access")
  ) {
    httpStatus = 404;
    friendlyMessage = `The AI model "${modelName}" is currently unavailable or not accessible with your Groq API key. Please check GROQ_MODEL in your environment settings.`;
  } else if (
    status === 401 ||
    providerCode === "invalid_api_key" ||
    combinedDetails.includes("invalid_api_key") ||
    combinedDetails.includes("missing_api_key") ||
    combinedDetails.includes("api key")
  ) {
    httpStatus = 401;
    friendlyMessage = "AI service authentication failed. Please verify that a valid GROQ_API_KEY is configured on the server.";
  } else if (
    status === 429 ||
    providerCode === "rate_limit_exceeded" ||
    combinedDetails.includes("rate_limit") ||
    combinedDetails.includes("rate limit")
  ) {
    httpStatus = 429;
    friendlyMessage = "AI rate limit reached. Please wait a moment before trying again.";
  } else if (
    error.code === "ETIMEDOUT" ||
    error.code === "ECONNRESET" ||
    combinedDetails.includes("timeout") ||
    status === 504
  ) {
    httpStatus = 504;
    friendlyMessage = "The AI service request timed out. Please try again in a few moments.";
  } else if (status >= 500) {
    httpStatus = 502;
    friendlyMessage = "The Groq AI service is temporarily experiencing issues. Please try again shortly.";
  } else if (providerMessage && !providerMessage.includes("{")) {
    friendlyMessage = providerMessage;
  }

  const sanitizedError = new Error(friendlyMessage);
  sanitizedError.status = httpStatus;
  sanitizedError.code = providerCode || (httpStatus === 404 ? "model_not_found" : "ai_error");
  return sanitizedError;
}

async function createGroqChatCompletion({
  messages,
  temperature = 0.2,
  maxTokens = 4096,
  model = getGroqModel()
}) {
  const activeModel = model || getGroqModel();
  try {
    const payload = await getGroqClient().chat.completions.create({
      model: activeModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = payload?.choices?.[0]?.message?.content;

    return {
      model: payload?.model || activeModel,
      usage: payload?.usage || null,
      json: extractJson(content),
      raw: payload
    };
  } catch (error) {
    throw formatGroqError(error, activeModel);
  }
}

module.exports = {
  DEFAULT_GROQ_MODEL,
  getGroqModel,
  GROQ_MODEL,
  getGroqClient,
  formatGroqError,
  createGroqChatCompletion
};
