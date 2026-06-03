"use client";

import { create } from "zustand";
import { defaultBookmarkTitle } from "@/lib/bookmark-utils";
import {
  createLocalBookmark,
  loadBookmarksFromLocal,
  removeBookmarkLocal,
  saveBookmarksToLocal,
  upsertBookmarkLocal,
} from "@/lib/bookmark-storage";
import { splitEnhancedSentences, splitSentences } from "@/lib/sentences";
import type { SpeedOption } from "@/lib/tts";
import type { Bookmark } from "@/types";
import { useReaderStore } from "./readerStore";

type BookmarkState = {
  bookmarks: Bookmark[];
  isLoading: boolean;
  isSaving: boolean;
  saveTitle: string;
  message: string | null;

  setSaveTitle: (title: string) => void;
  clearMessage: () => void;
  fetchBookmarks: () => Promise<void>;
  saveCurrentAsBookmark: () => Promise<void>;
  applyBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => Promise<void>;
};

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  isSaving: false,
  saveTitle: "",
  message: null,

  setSaveTitle: (saveTitle) => set({ saveTitle }),
  clearMessage: () => set({ message: null }),

  fetchBookmarks: async () => {
    set({ isLoading: true, message: null });
    try {
      const res = await fetch("/api/bookmarks");
      if (res.ok) {
        const data = (await res.json()) as { bookmarks: Bookmark[] };
        saveBookmarksToLocal(data.bookmarks);
        set({ bookmarks: data.bookmarks, isLoading: false });
        return;
      }
    } catch {
      /* fallback below */
    }
    set({
      bookmarks: loadBookmarksFromLocal(),
      message: "Đang dùng bookmark lưu trên trình duyệt (MongoDB không khả dụng).",
      isLoading: false,
    });
  },

  saveCurrentAsBookmark: async () => {
    const reader = useReaderStore.getState();
    if (!reader.script.trim()) {
      set({ message: "Nhập script trước khi lưu bookmark." });
      return;
    }

    set({ isSaving: true, message: null });

    const title =
      get().saveTitle.trim() || defaultBookmarkTitle(reader.script);
    const payload = {
      title,
      script: reader.script,
      enhancedScript: reader.enhancedScript,
      mode: reader.mode,
      speed: reader.speed,
      voiceLang: reader.voiceLang,
      useAiEnhancement: reader.useAiEnhancement,
      selectedSentenceIndex: reader.selectedIndex,
    };

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json()) as { bookmark: Bookmark };
        const list = upsertBookmarkLocal(data.bookmark);
        set({
          bookmarks: list,
          saveTitle: "",
          message: `Đã lưu bookmark "${data.bookmark.title}".`,
          isSaving: false,
        });
        return;
      }
    } catch {
      /* local fallback */
    }

    const local = createLocalBookmark(payload);
    const list = upsertBookmarkLocal(local);
    set({
      bookmarks: list,
      saveTitle: "",
      message: `Đã lưu bookmark "${local.title}" trên trình duyệt.`,
      isSaving: false,
    });
  },

  applyBookmark: (bookmark) => {
    const reader = useReaderStore.getState();
    reader.requestStop();
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    if (reader.audioUrl) {
      URL.revokeObjectURL(reader.audioUrl);
    }

    useReaderStore.setState({
      mode: bookmark.mode,
      script: bookmark.script,
      sentences: bookmark.enhancedScript
        ? splitEnhancedSentences(bookmark.enhancedScript)
        : splitSentences(bookmark.script),
      enhancedScript: bookmark.enhancedScript,
      speed: bookmark.speed as SpeedOption,
      voiceLang: bookmark.voiceLang,
      useAiEnhancement: bookmark.useAiEnhancement,
      selectedIndex: bookmark.selectedSentenceIndex,
      currentIndex: bookmark.selectedSentenceIndex ?? 0,
      audioUrl: null,
      playback: "idle",
      stopRequested: false,
      error:
        bookmark.mode === "mp3"
          ? "Bookmark đã tải — hãy upload lại file MP3 nếu cần."
          : null,
    });

    set({ message: `Đã mở bookmark "${bookmark.title}".` });
  },

  removeBookmark: async (id) => {
    set({ message: null });

    if (id.startsWith("local-")) {
      set({ bookmarks: removeBookmarkLocal(id), message: "Đã xóa bookmark." });
      return;
    }

    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) {
        set({
          bookmarks: removeBookmarkLocal(id),
          message: "Đã xóa bookmark.",
        });
        return;
      }
    } catch {
      /* local only */
    }

    set({ bookmarks: removeBookmarkLocal(id), message: "Đã xóa bookmark." });
  },
}));
