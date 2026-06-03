"use client";

import { create } from "zustand";
import {
  addUserGeminiKey,
  loadUserGeminiKeys,
  removeUserGeminiKey,
  type StoredGeminiKey,
} from "@/lib/gemini-key-storage";

type GeminiKeyState = {
  keys: StoredGeminiKey[];
  envKeyCount: number | null;
  draftKey: string;
  draftLabel: string;
  message: string | null;
  hydrated: boolean;

  hydrate: () => void;
  fetchEnvKeyCount: () => Promise<void>;
  setDraftKey: (value: string) => void;
  setDraftLabel: (value: string) => void;
  addKey: () => void;
  removeKey: (id: string) => void;
  clearMessage: () => void;
  getKeyValues: () => string[];
};

export const useGeminiKeyStore = create<GeminiKeyState>((set, get) => ({
  keys: [],
  envKeyCount: null,
  draftKey: "",
  draftLabel: "",
  message: null,
  hydrated: false,

  hydrate: () => {
    set({ keys: loadUserGeminiKeys(), hydrated: true });
  },

  fetchEnvKeyCount: async () => {
    try {
      const res = await fetch("/api/settings/gemini");
      if (res.ok) {
        const data = (await res.json()) as { envKeyCount: number };
        set({ envKeyCount: data.envKeyCount });
      }
    } catch {
      set({ envKeyCount: null });
    }
  },

  setDraftKey: (draftKey) => set({ draftKey }),
  setDraftLabel: (draftLabel) => set({ draftLabel }),

  addKey: () => {
    const { draftKey, draftLabel } = get();
    if (!draftKey.trim()) {
      set({ message: "Nhập API key trước khi thêm." });
      return;
    }
    const list = addUserGeminiKey(draftKey, draftLabel);
    set({
      keys: list,
      draftKey: "",
      draftLabel: "",
      message: "Đã thêm API key (lưu trên trình duyệt này).",
    });
  },

  removeKey: (id) => {
    set({
      keys: removeUserGeminiKey(id),
      message: "Đã xóa API key.",
    });
  },

  clearMessage: () => set({ message: null }),

  getKeyValues: () => get().keys.map((k) => k.key),
}));
