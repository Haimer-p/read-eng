import { hashScript } from "./cache";

const COOLDOWN_MS = 60_000;
const inFlight = new Map<string, Promise<unknown>>();
const lastApiCallAt = new Map<string, number>();

export function canCallEnhanceApi(script: string): { ok: true } | { ok: false; reason: string } {
  const hash = hashScript(script);
  if (inFlight.has(hash)) {
    return { ok: false, reason: "Đang xử lý enhancement cho script này, vui lòng đợi." };
  }

  const last = lastApiCallAt.get(hash);
  if (last && Date.now() - last < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    return {
      ok: false,
      reason: `Tránh gọi AI liên tục — thử lại sau ${waitSec}s (hoặc dùng cache nếu đã enhance trước đó).`,
    };
  }

  return { ok: true };
}

export function markEnhanceApiCalled(script: string): void {
  lastApiCallAt.set(hashScript(script), Date.now());
}

export async function withEnhanceInFlight<T>(
  script: string,
  fn: () => Promise<T>,
): Promise<T> {
  const hash = hashScript(script);
  const existing = inFlight.get(hash);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlight.delete(hash);
  });
  inFlight.set(hash, promise);
  return promise;
}
