"use client";

import { useCallback, useEffect, useRef } from "react";
import { splitEnhancedSentences, splitSentences } from "@/lib/sentences";
import {
  ensureVoicesLoaded,
  speakSentences,
  speakText,
  stopSpeech,
} from "@/lib/tts";
import { useGeminiKeyStore } from "@/stores/geminiKeyStore";
import { useReaderStore } from "@/stores/readerStore";

export function useReaderPlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enhanceInFlight = useRef<Promise<void> | null>(null);
  const playbackGeneration = useRef(0);
  const store = useReaderStore();

  useEffect(() => {
    void ensureVoicesLoaded();
  }, []);

  const getTtsSentences = useCallback(() => {
    const state = useReaderStore.getState();
    const useEnhanced = state.useAiEnhancement && state.enhancedScript;
    const text = useEnhanced ? state.enhancedScript : state.script;
    return useEnhanced
      ? splitEnhancedSentences(text)
      : splitSentences(text);
  }, []);

  const stopAllPlayback = useCallback(async () => {
    const state = useReaderStore.getState();
    state.requestStop();
    await stopSpeech();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    playbackGeneration.current += 1;
    state.setPlaybackScope("none");
    state.setPlayback("idle");
  }, []);

  const finishIfCurrent = useCallback((gen: number) => {
    if (playbackGeneration.current !== gen) return;
    const state = useReaderStore.getState();
    if (state.stopRequested) return;
    state.setPlayback("idle");
    state.setPlaybackScope("none");
  }, []);

  const requestEnhance = useCallback(async () => {
    const state = useReaderStore.getState();
    if (!state.script.trim()) {
      state.setError("Vui lòng nhập script trước.");
      return;
    }
    if (state.enhancedScript) {
      state.setError(null);
      return;
    }
    if (enhanceInFlight.current) {
      return enhanceInFlight.current;
    }

    state.setIsEnhancing(true);
    state.setError(null);

    const task = (async () => {
      try {
        const clientKeys = useGeminiKeyStore.getState().getKeyValues();
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            script: state.script,
            clientKeys,
          }),
        });
        const data = (await res.json()) as {
          enhancedText?: string;
          cached?: boolean;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Enhancement failed");
        }
        useReaderStore.getState().setEnhancedScript(data.enhancedText ?? "");
      } catch (e) {
        useReaderStore
          .getState()
          .setError(e instanceof Error ? e.message : "Enhancement failed");
        throw e;
      } finally {
        useReaderStore.getState().setIsEnhancing(false);
        enhanceInFlight.current = null;
      }
    })();

    enhanceInFlight.current = task;
    return task;
  }, []);

  const startMp3 = useCallback(async () => {
    const state = useReaderStore.getState();
    if (!state.audioUrl) {
      state.setError("Vui lòng upload file MP3.");
      return;
    }
    if (!state.script.trim()) {
      state.setError("Vui lòng nhập script.");
      return;
    }

    await stopAllPlayback();
    const audio = audioRef.current;
    if (!audio) return;

    state.setError(null);
    state.clearStop();
    state.setPlayback("playing");
    audio.currentTime = 0;
    await audio.play();
  }, [stopAllPlayback]);

  const pauseMp3 = useCallback(() => {
    audioRef.current?.pause();
    useReaderStore.getState().setPlayback("paused");
  }, []);

  const resumeMp3 = useCallback(async () => {
    await audioRef.current?.play();
    useReaderStore.getState().setPlayback("playing");
  }, []);

  const stopMp3 = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    await stopAllPlayback();
    useReaderStore.getState().resetPlayback();
  }, [stopAllPlayback]);

  const playSentenceAt = useCallback(
    async (index: number) => {
      const state = useReaderStore.getState();
      const sentences = state.sentences;
      const sentence = sentences[index];
      if (!sentence) return;

      await stopAllPlayback();

      const gen = playbackGeneration.current;
      const s = useReaderStore.getState();
      s.clearStop();
      s.selectSentence(index);
      s.setCurrentIndex(index);
      s.setPlaybackScope("sentence");
      s.setPlayback("playing");
      s.setError(null);

      try {
        await speakText(sentence, {
          rate: s.speed,
          voiceLang: s.voiceLang,
          cancelFirst: false,
        });
      } catch (e) {
        if (playbackGeneration.current === gen) {
          s.setError(
            e instanceof Error ? e.message : "Không phát được giọng đọc.",
          );
        }
      } finally {
        finishIfCurrent(gen);
      }
    },
    [stopAllPlayback, finishIfCurrent],
  );

  const startTts = useCallback(async () => {
    const state = useReaderStore.getState();
    if (!state.script.trim()) {
      state.setError("Vui lòng nhập script.");
      return;
    }

    if (state.useAiEnhancement && !state.enhancedScript) {
      state.setError(
        "Bật AI Enhancement: nhấn «Enhance với AI» trước khi Start (tránh gọi API tự động).",
      );
      return;
    }

    const sentences = getTtsSentences();
    if (sentences.length === 0) {
      state.setError("Không có câu nào để đọc.");
      return;
    }

    await stopAllPlayback();

    const gen = playbackGeneration.current;
    const s = useReaderStore.getState();
    const startIndex = s.selectedIndex ?? 0;
    const slice = sentences.slice(startIndex);

    s.setError(null);
    s.clearStop();
    s.setPlaybackScope("full");
    s.setPlayback("playing");

    try {
      await speakSentences(slice, {
        rate: s.speed,
        voiceLang: s.voiceLang,
        onIndex: (i) => {
          if (playbackGeneration.current !== gen) return;
          useReaderStore.getState().setCurrentIndex(startIndex + i);
        },
        shouldStop: () => {
          const current = useReaderStore.getState();
          return (
            current.stopRequested || playbackGeneration.current !== gen
          );
        },
      });
    } catch (e) {
      if (playbackGeneration.current === gen) {
        s.setError(
          e instanceof Error ? e.message : "Không phát được giọng đọc.",
        );
      }
    } finally {
      finishIfCurrent(gen);
    }
  }, [getTtsSentences, stopAllPlayback, finishIfCurrent]);

  const pauseTts = useCallback(() => {
    const state = useReaderStore.getState();
    if (state.playbackScope !== "full") return;
    window.speechSynthesis.pause();
    state.setPlayback("paused");
  }, []);

  const resumeTts = useCallback(() => {
    const state = useReaderStore.getState();
    if (state.playbackScope !== "full") return;
    window.speechSynthesis.resume();
    state.setPlayback("playing");
  }, []);

  const stopTts = useCallback(async () => {
    await stopAllPlayback();
    useReaderStore.getState().resetPlayback();
  }, [stopAllPlayback]);

  const readSelection = useCallback(async () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) return;

    await stopAllPlayback();

    const gen = playbackGeneration.current;
    const s = useReaderStore.getState();
    s.clearStop();
    s.setPlaybackScope("selection");
    s.setPlayback("playing");
    s.setError(null);

    try {
      await speakText(selection, {
        rate: s.speed,
        voiceLang: s.voiceLang,
        cancelFirst: false,
      });
    } catch (e) {
      if (playbackGeneration.current === gen) {
        s.setError(
          e instanceof Error ? e.message : "Không phát được giọng đọc.",
        );
      }
    } finally {
      finishIfCurrent(gen);
    }
  }, [stopAllPlayback, finishIfCurrent]);

  const handleAudioTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    const state = useReaderStore.getState();
    if (!audio || !audio.duration || state.sentences.length === 0) return;

    const index = Math.min(
      state.sentences.length - 1,
      Math.floor((audio.currentTime / audio.duration) * state.sentences.length),
    );
    state.setCurrentIndex(index);
  }, []);

  const handleAudioEnded = useCallback(() => {
    useReaderStore.getState().resetPlayback();
  }, []);

  return {
    audioRef,
    requestEnhance,
    playSentenceAt,
    startMp3,
    pauseMp3,
    resumeMp3,
    stopMp3,
    startTts,
    pauseTts,
    resumeTts,
    stopTts,
    readSelection,
    handleAudioTimeUpdate,
    handleAudioEnded,
  };
}
