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
  const store = useReaderStore();

  useEffect(() => {
    void ensureVoicesLoaded();
  }, []);

  const getTtsSentences = useCallback(() => {
    const useEnhanced = store.useAiEnhancement && store.enhancedScript;
    const text = useEnhanced ? store.enhancedScript : store.script;
    return useEnhanced
      ? splitEnhancedSentences(text)
      : splitSentences(text);
  }, [store.useAiEnhancement, store.enhancedScript, store.script]);

  const requestEnhance = useCallback(async () => {
    if (!store.script.trim()) {
      store.setError("Vui lòng nhập script trước.");
      return;
    }
    if (store.enhancedScript) {
      store.setError(null);
      return;
    }
    if (enhanceInFlight.current) {
      return enhanceInFlight.current;
    }

    store.setIsEnhancing(true);
    store.setError(null);

    const task = (async () => {
      try {
        const clientKeys = useGeminiKeyStore.getState().getKeyValues();
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script: store.script, clientKeys }),
        });
        const data = (await res.json()) as {
          enhancedText?: string;
          cached?: boolean;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Enhancement failed");
        }
        store.setEnhancedScript(data.enhancedText ?? "");
        if (data.cached) {
          store.setError(null);
        }
      } catch (e) {
        store.setError(e instanceof Error ? e.message : "Enhancement failed");
        throw e;
      } finally {
        store.setIsEnhancing(false);
        enhanceInFlight.current = null;
      }
    })();

    enhanceInFlight.current = task;
    return task;
  }, [store]);

  const startMp3 = useCallback(async () => {
    if (!store.audioUrl) {
      store.setError("Vui lòng upload file MP3.");
      return;
    }
    if (!store.script.trim()) {
      store.setError("Vui lòng nhập script.");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    store.setError(null);
    store.clearStop();
    store.setPlayback("playing");
    audio.currentTime = 0;
    await audio.play();
  }, [store]);

  const pauseMp3 = useCallback(() => {
    audioRef.current?.pause();
    store.setPlayback("paused");
  }, [store]);

  const resumeMp3 = useCallback(async () => {
    await audioRef.current?.play();
    store.setPlayback("playing");
  }, [store]);

  const stopMp3 = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    store.resetPlayback();
  }, [store]);

  const startTts = useCallback(async () => {
    if (!store.script.trim()) {
      store.setError("Vui lòng nhập script.");
      return;
    }

    if (store.useAiEnhancement && !store.enhancedScript) {
      store.setError(
        "Bật AI Enhancement: nhấn «Enhance với AI» trước khi Start (tránh gọi API tự động).",
      );
      return;
    }

    const sentences = getTtsSentences();
    if (sentences.length === 0) {
      store.setError("Không có câu nào để đọc.");
      return;
    }

    const startIndex = store.selectedIndex ?? 0;
    const slice = sentences.slice(startIndex);

    store.setError(null);
    store.clearStop();
    store.setPlayback("playing");

    try {
      await speakSentences(slice, {
        rate: store.speed,
        voiceLang: store.voiceLang,
        onIndex: (i) => store.setCurrentIndex(startIndex + i),
        shouldStop: () => useReaderStore.getState().stopRequested,
      });
    } catch (e) {
      store.setError(
        e instanceof Error ? e.message : "Không phát được giọng đọc.",
      );
    } finally {
      if (!useReaderStore.getState().stopRequested) {
        store.setPlayback("idle");
      }
    }
  }, [store, getTtsSentences]);

  const pauseTts = useCallback(() => {
    window.speechSynthesis.pause();
    store.setPlayback("paused");
  }, [store]);

  const resumeTts = useCallback(() => {
    window.speechSynthesis.resume();
    store.setPlayback("playing");
  }, [store]);

  const stopTts = useCallback(() => {
    store.requestStop();
    void stopSpeech();
    store.resetPlayback();
  }, [store]);

  const readSelection = useCallback(async () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) return;

    store.clearStop();
    store.setPlayback("playing");
    try {
      await speakText(selection, {
        rate: store.speed,
        voiceLang: store.voiceLang,
        cancelFirst: true,
      });
    } catch (e) {
      store.setError(
        e instanceof Error ? e.message : "Không phát được giọng đọc.",
      );
    } finally {
      store.setPlayback("idle");
    }
  }, [store]);

  const readSelectedSentence = useCallback(async () => {
    if (store.selectedIndex === null) return;
    const sentence = store.sentences[store.selectedIndex];
    if (!sentence) return;

    store.clearStop();
    store.setPlayback("playing");
    store.setCurrentIndex(store.selectedIndex);
    try {
      await speakText(sentence, {
        rate: store.speed,
        voiceLang: store.voiceLang,
        cancelFirst: true,
      });
    } catch (e) {
      store.setError(
        e instanceof Error ? e.message : "Không phát được giọng đọc.",
      );
    } finally {
      store.setPlayback("idle");
    }
  }, [store]);

  const handleAudioTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || store.sentences.length === 0) return;

    const index = Math.min(
      store.sentences.length - 1,
      Math.floor((audio.currentTime / audio.duration) * store.sentences.length),
    );
    store.setCurrentIndex(index);
  }, [store]);

  const handleAudioEnded = useCallback(() => {
    store.resetPlayback();
  }, [store]);

  return {
    audioRef,
    requestEnhance,
    startMp3,
    pauseMp3,
    resumeMp3,
    stopMp3,
    startTts,
    pauseTts,
    resumeTts,
    stopTts,
    readSelection,
    readSelectedSentence,
    handleAudioTimeUpdate,
    handleAudioEnded,
  };
}
