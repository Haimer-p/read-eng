type KeyState = {
  key: string;
  errorCount: number;
};

const ROTATABLE_STATUSES = new Set([429, 403, 500, 503]);

function loadEnvKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => Boolean(k && k.trim()));
}

export function countEnvGeminiKeys(): number {
  return loadEnvKeys().length;
}

/** User keys first (UI), then .env — deduped. */
export function resolveGeminiKeys(clientKeys: string[] = []): string[] {
  const trimmedClient = clientKeys.map((k) => k.trim()).filter(Boolean);
  const env = loadEnvKeys();
  const merged = [...trimmedClient, ...env];
  const unique = [...new Set(merged)];

  if (unique.length === 0) {
    throw new Error(
      "Chưa có Gemini API key — thêm trong Cài đặt hoặc .env.local (https://aistudio.google.com/apikey)",
    );
  }

  const aiStudio = unique.filter((k) => k.startsWith("AIza"));
  const other = unique.filter((k) => !k.startsWith("AIza"));
  return [...aiStudio, ...other];
}

export class GeminiKeyManager {
  private keys: KeyState[];
  private index = 0;

  constructor(keyList: string[]) {
    this.keys = keyList.map((key) => ({ key, errorCount: 0 }));
  }

  getNextKey(): string {
    const start = this.index;
    do {
      const state = this.keys[this.index];
      this.index = (this.index + 1) % this.keys.length;
      if (state.errorCount < 5) {
        return state.key;
      }
    } while (this.index !== start);

    throw new Error("All Gemini API keys are exhausted");
  }

  markSuccess(key: string): void {
    const state = this.keys.find((k) => k.key === key);
    if (state) state.errorCount = 0;
  }

  markFailed(key: string, status?: number): void {
    const state = this.keys.find((k) => k.key === key);
    if (!state) return;
    if (status === undefined || ROTATABLE_STATUSES.has(status)) {
      state.errorCount += 1;
    }
  }
}

export async function withGeminiKeys<T>(
  fn: (apiKey: string) => Promise<T>,
  clientKeys: string[] = [],
): Promise<T> {
  const allKeys = resolveGeminiKeys(clientKeys);
  const manager = new GeminiKeyManager(allKeys);
  const tried = new Set<string>();
  let lastError: unknown;

  while (tried.size < allKeys.length) {
    const key = manager.getNextKey();
    if (tried.has(key)) break;
    tried.add(key);

    try {
      const result = await fn(key);
      manager.markSuccess(key);
      return result;
    } catch (error) {
      lastError = error;
      const status =
        error instanceof GeminiApiError ? error.status : undefined;
      manager.markFailed(key, status);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed for all keys");
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}
