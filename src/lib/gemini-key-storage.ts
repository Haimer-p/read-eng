const STORAGE_KEY = "english-reader-gemini-keys";

export type StoredGeminiKey = {
  id: string;
  key: string;
  label: string;
  createdAt: string;
};

export function maskGeminiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 10) return "••••••••";
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

export function loadUserGeminiKeys(): StoredGeminiKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGeminiKey[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserGeminiKeys(keys: StoredGeminiKey[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getUserGeminiKeyValues(): string[] {
  return loadUserGeminiKeys().map((k) => k.key.trim()).filter(Boolean);
}

export function addUserGeminiKey(key: string, label?: string): StoredGeminiKey[] {
  const trimmed = key.trim();
  if (!trimmed) return loadUserGeminiKeys();

  const list = loadUserGeminiKeys();
  if (list.some((k) => k.key === trimmed)) return list;

  const entry: StoredGeminiKey = {
    id: `gk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: trimmed,
    label: label?.trim() || `Key ${list.length + 1}`,
    createdAt: new Date().toISOString(),
  };

  const next = [entry, ...list];
  saveUserGeminiKeys(next);
  return next;
}

export function removeUserGeminiKey(id: string): StoredGeminiKey[] {
  const next = loadUserGeminiKeys().filter((k) => k.id !== id);
  saveUserGeminiKeys(next);
  return next;
}
