"use client";

import { useCallback, useEffect, useRef } from "react";
import { splitEnhancedSentences, splitSentences } from "@/lib/sentences";
import { pickVoice, speakSentences, speakText } from "@/lib/tts";
import { useReaderStore } from "@/stores/readerStore";

export function useReaderPlayback() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const store = useReaderStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getTtsSentences = useCallback(() => {
    const text =
      store.useAiEnhancement && store.enhancedScript
        ? store.enhancedScript
        : store.script;
    return store.useAiEnhancement && store.enhancedScript
      ? splitEnhancedSentences(text)
      : splitSentences(text);
  }, [store.useAiEnhancement, store.enhancedScript, store.script]);

  const enhanceIfNeeded = useCallback(async () => {
    if (!store.useAiEnhancement || store.mode !== "tts") return;
    if (!store.script.trim()) {
      store.setError("Vui lòng nhập script trước.");
      return;
    }
    if (store.enhancedScript) return;

    store.setIsEnhancing(true);
    store.setError(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: store.script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enhancement failed");
      store.setEnhancedScript(data.enhancedText);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "Enhancement failed");
      throw e;
    } finally {
      store.setIsEnhancing(false);
    }
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

    try {
      await enhanceIfNeeded();
    } catch {
      return;
    }

    const sentences = getTtsSentences();
    if (sentences.length === 0) {
      store.setError("Không có câu nào để đọc.");
      return;
    }

    const startIndex = store.selectedIndex ?? 0;
    const slice = sentences.slice(startIndex);
    const voice = pickVoice(store.voiceLang);

    store.setError(null);
    store.clearStop();
    store.setPlayback("playing");

    try {
      await speakSentences(slice, {
        rate: store.speed,
        voice,
        onIndex: (i) => store.setCurrentIndex(startIndex + i),
        shouldStop: () => useReaderStore.getState().stopRequested,
      });
    } finally {
      if (!useReaderStore.getState().stopRequested) {
        store.setPlayback("idle");
      }
    }
  }, [store, enhanceIfNeeded, getTtsSentences]);

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
    window.speechSynthesis.cancel();
    store.resetPlayback();
  }, [store]);

  const readSelection = useCallback(async () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) return;

    const voice = pickVoice(store.voiceLang);
    store.clearStop();
    store.setPlayback("playing");
    try {
      await speakText(selection, { rate: store.speed, voice });
    } finally {
      store.setPlayback("idle");
    }
  }, [store]);

  const readSelectedSentence = useCallback(async () => {
    if (store.selectedIndex === null) return;
    const sentence = store.sentences[store.selectedIndex];
    if (!sentence) return;

    const voice = pickVoice(store.voiceLang);
    store.clearStop();
    store.setPlayback("playing");
    store.setCurrentIndex(store.selectedIndex);
    try {
      await speakText(sentence, { rate: store.speed, voice });
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
