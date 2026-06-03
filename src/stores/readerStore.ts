import { create } from "zustand";
import { splitEnhancedSentences, splitSentences } from "@/lib/sentences";
import type { ReaderMode } from "@/types";
import type { SpeedOption } from "@/lib/tts";

type PlaybackState = "idle" | "playing" | "paused";

export type PlaybackScope = "none" | "full" | "sentence" | "selection";

type ReaderState = {
  mode: ReaderMode;
  script: string;
  sentences: string[];
  enhancedScript: string;
  currentIndex: number;
  selectedIndex: number | null;
  playback: PlaybackState;
  playbackScope: PlaybackScope;
  speed: SpeedOption;
  voiceLang: string;
  useAiEnhancement: boolean;
  audioUrl: string | null;
  isEnhancing: boolean;
  error: string | null;
  stopRequested: boolean;

  setMode: (mode: ReaderMode) => void;
  setScript: (script: string) => void;
  setAudioUrl: (url: string | null) => void;
  setSpeed: (speed: SpeedOption) => void;
  setVoiceLang: (lang: string) => void;
  setUseAiEnhancement: (value: boolean) => void;
  setCurrentIndex: (index: number) => void;
  selectSentence: (index: number | null) => void;
  setEnhancedScript: (text: string) => void;
  setIsEnhancing: (value: boolean) => void;
  setError: (error: string | null) => void;
  setPlayback: (playback: PlaybackState) => void;
  setPlaybackScope: (scope: PlaybackScope) => void;
  requestStop: () => void;
  clearStop: () => void;
  resetPlayback: () => void;
};

export const useReaderStore = create<ReaderState>((set) => ({
  mode: "tts",
  script: "",
  sentences: [],
  enhancedScript: "",
  currentIndex: 0,
  selectedIndex: null,
  playback: "idle",
  playbackScope: "none",
  speed: 1,
  voiceLang: "en-GB",
  useAiEnhancement: true,
  audioUrl: null,
  isEnhancing: false,
  error: null,
  stopRequested: false,

  setMode: (mode) => set({ mode }),
  setScript: (script) =>
    set({
      script,
      sentences: splitSentences(script),
      currentIndex: 0,
      selectedIndex: null,
      enhancedScript: "",
      error: null,
    }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setSpeed: (speed) => set({ speed }),
  setVoiceLang: (voiceLang) => set({ voiceLang }),
  setUseAiEnhancement: (useAiEnhancement) => set({ useAiEnhancement }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  selectSentence: (selectedIndex) => set({ selectedIndex }),
  setEnhancedScript: (enhancedScript) =>
    set({
      enhancedScript,
      sentences: splitEnhancedSentences(enhancedScript),
      error: null,
    }),
  setIsEnhancing: (isEnhancing) => set({ isEnhancing }),
  setError: (error) => set({ error }),
  setPlayback: (playback) => set({ playback }),
  setPlaybackScope: (playbackScope) => set({ playbackScope }),
  requestStop: () => set({ stopRequested: true, playback: "idle" }),
  clearStop: () => set({ stopRequested: false }),
  resetPlayback: () =>
    set({
      playback: "idle",
      playbackScope: "none",
      stopRequested: false,
    }),
}));
