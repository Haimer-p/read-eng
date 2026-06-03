type KeyState = {
  key: string;
  errorCount: number;
};

const ROTATABLE_STATUSES = new Set([429, 403, 500, 503]);

function loadKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => Boolean(k && k.trim()));

  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY_* configured");
  }
  return keys;
}

export class GeminiKeyManager {
  private keys: KeyState[];
  private index = 0;

  constructor() {
    this.keys = loadKeys().map((key) => ({ key, errorCount: 0 }));
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
): Promise<T> {
  const manager = new GeminiKeyManager();
  const totalKeys = loadKeys().length;
  const tried = new Set<string>();
  let lastError: unknown;

  while (tried.size < totalKeys) {
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
