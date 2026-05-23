const Groq = require("groq-sdk");

const GROQ_MODEL = "llama-3.3-70b-versatile";

let client;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Add it to your .env file.");
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

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq response was not valid JSON.");
    }

    return JSON.parse(match[0]);
  }
}

async function createGroqChatCompletion({
  messages,
  temperature = 0.2,
  maxTokens = 4096
}) {
  const payload = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" }
  });

  const content = payload?.choices?.[0]?.message?.content;

  return {
    model: payload?.model || GROQ_MODEL,
    usage: payload?.usage || null,
    json: extractJson(content),
    raw: payload
  };
}

module.exports = {
  GROQ_MODEL,
  getGroqClient,
  createGroqChatCompletion
};
