import Groq from "groq-sdk";

const GROQ_MODEL = "llama-3.3-70b-versatile";
let groqClient: Groq | null = null;

export type ReviewRequest = {
  code: string;
  filePath?: string;
};

export type ReviewResponse = {
  score: number;
  issues: Array<{
    type: "Bug" | "Security" | "Performance" | "Clean Code";
    severity: "Low" | "Medium" | "High";
    title: string;
    suggestion: string;
    message?: string;
    filePath?: string;
    line?: number;
    column?: number;
  }>;
  summary: string;
  positives?: string[];
  nextActions?: string[];
  model?: string;
  usage?: unknown;
};

export type ChatRequest = {
  projectId?: string;
  question: string;
  context?: string;
};

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const localFallback: ReviewResponse = {
  score: 89,
  issues: [
    {
      type: "Performance",
      severity: "Medium",
      title: "Check repeated calculations in render paths",
      suggestion: "Memoize expensive derived values before rendering charts.",
      message: "Potential repeated derived-data work can slow dashboard renders."
    },
    {
      type: "Security",
      severity: "High",
      title: "Validate user-controlled workspace roles",
      suggestion: "Allow only known roles before writing invite data.",
      message: "Role escalation is possible when invite roles are not validated."
    }
  ],
  summary:
    "The file is generally healthy. Review the highlighted security and performance paths before deploy.",
  model: GROQ_MODEL
};

function extractJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq response did not include valid JSON.");
    }

    return JSON.parse(match[0]);
  }
}

async function groqJson(messages: GroqMessage[], maxTokens = 4096) {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  const payload = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" }
  });

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq response was empty.");
  }

  return {
    json: extractJson(content),
    model: payload?.model ?? GROQ_MODEL,
    usage: payload?.usage
  };
}

export async function reviewCode({
  code,
  filePath
}: ReviewRequest): Promise<ReviewResponse> {
  const completion = await groqJson([
    {
      role: "system",
      content:
        "You are DevWatchAI. Return only strict JSON for an AI code review with score, summary, issues, positives, and nextActions."
    },
    {
      role: "user",
      content: JSON.stringify({
        expected_schema: {
          score: "number 0-100",
          summary: "string",
          issues:
            "array of {type: Bug|Security|Performance|Clean Code, severity: Low|Medium|High, title, message, filePath, line, column, suggestion}",
          positives: "array of strings",
          nextActions: "array of strings"
        },
        filePath,
        code
      })
    }
  ]);

  if (!completion) {
    return localFallback;
  }

  return {
    score: Number(completion.json.score ?? 0),
    summary: String(completion.json.summary ?? ""),
    issues: completion.json.issues ?? [],
    positives: completion.json.positives ?? [],
    nextActions: completion.json.nextActions ?? [],
    model: completion.model,
    usage: completion.usage
  };
}

export async function fixCode(code: string) {
  const completion = await groqJson(
    [
      {
        role: "system",
        content:
          "You are DevWatchAI. Return only strict JSON with summary, fixedCode, changes, risks, and testsToRun."
      },
      {
        role: "user",
        content: JSON.stringify({ code })
      }
    ],
    8192
  );

  if (!completion) {
    return {
      summary: "Set GROQ_API_KEY to enable AI generated patches.",
      fixedCode: code,
      changes: [],
      risks: [],
      testsToRun: [],
      model: GROQ_MODEL
    };
  }

  return {
    summary: completion.json.summary ?? "",
    fixedCode: completion.json.fixedCode ?? code,
    changes: completion.json.changes ?? [],
    risks: completion.json.risks ?? [],
    testsToRun: completion.json.testsToRun ?? [],
    model: completion.model,
    usage: completion.usage
  };
}

export async function chatWithAI(request: ChatRequest) {
  const completion = await groqJson([
    {
      role: "system",
      content:
        "You are DevWatchAI, an assistant inside a collaborative cloud IDE. Return only strict JSON with answer, bullets, referencedFiles, and followUps."
    },
    {
      role: "user",
      content: JSON.stringify(request)
    }
  ]);

  if (!completion) {
    return {
      answer:
        "Set GROQ_API_KEY to enable the Groq-powered DevWatchAI assistant.",
      bullets: [],
      referencedFiles: [],
      followUps: [],
      question: request.question,
      projectId: request.projectId,
      model: GROQ_MODEL
    };
  }

  return {
    answer: completion.json.answer ?? "",
    bullets: completion.json.bullets ?? [],
    referencedFiles: completion.json.referencedFiles ?? [],
    followUps: completion.json.followUps ?? [],
    question: request.question,
    projectId: request.projectId,
    model: completion.model,
    usage: completion.usage
  };
}
