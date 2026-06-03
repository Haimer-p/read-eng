import type { Bookmark } from "@/types";

const STORAGE_KEY = "english-reader-bookmarks";

export function loadBookmarksFromLocal(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarksToLocal(bookmarks: Bookmark[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function upsertBookmarkLocal(bookmark: Bookmark): Bookmark[] {
  const list = loadBookmarksFromLocal();
  const idx = list.findIndex((b) => b.id === bookmark.id);
  if (idx >= 0) list[idx] = bookmark;
  else list.unshift(bookmark);
  const sorted = [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  saveBookmarksToLocal(sorted);
  return sorted;
}

export function removeBookmarkLocal(id: string): Bookmark[] {
  const list = loadBookmarksFromLocal().filter((b) => b.id !== id);
  saveBookmarksToLocal(list);
  return list;
}

export function createLocalBookmark(
  data: Omit<Bookmark, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
): Bookmark {
  const now = new Date().toISOString();
  return {
    id: data.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    title: data.title,
    script: data.script,
    enhancedScript: data.enhancedScript,
    mode: data.mode,
    speed: data.speed,
    voiceLang: data.voiceLang,
    useAiEnhancement: data.useAiEnhancement,
    selectedSentenceIndex: data.selectedSentenceIndex,
  };
}
