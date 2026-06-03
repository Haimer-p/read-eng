import { GeminiApiError, withGeminiKeys } from "./key-manager";

const SYSTEM_PROMPT = `You are an expert speech editor.

Your task:

1. Keep all words unchanged.
2. Never add new information.
3. Improve punctuation.
4. Add pauses.
5. Add emphasis with capitalization.
6. Split long sentences.

Return plain text only.`;

function getModelCandidates(): string[] {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  const defaults = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];
  return [...new Set([fromEnv, ...defaults].filter(Boolean))] as string[];
}

async function parseGeminiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; status?: string };
    };
    return body.error?.message ?? `Gemini API error: ${response.status}`;
  } catch {
    return `Gemini API error: ${response.status}`;
  }
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  script: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: script }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await parseGeminiError(response);
    throw new GeminiApiError(message, response.status);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new GeminiApiError("Empty Gemini response", 500);
  }

  return text;
}

export async function enhanceScript(
  script: string,
  clientKeys: string[] = [],
): Promise<string> {
  const models = getModelCandidates();
  let lastError: unknown;

  return withGeminiKeys(async (apiKey) => {
    for (const model of models) {
      try {
        return await callGeminiModel(apiKey, model, script);
      } catch (error) {
        lastError = error;
        if (error instanceof GeminiApiError) {
          if (error.status === 404) continue;
          if (error.status === 429) throw error;
        }
        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("No Gemini model available");
  }, clientKeys);
}
