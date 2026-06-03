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

export async function enhanceScript(script: string): Promise<string> {
  return withGeminiKeys(async (apiKey) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
      throw new GeminiApiError(
        `Gemini API error: ${response.status}`,
        response.status,
      );
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
  });
}
