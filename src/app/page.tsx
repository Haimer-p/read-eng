"use client";

import { AudioPlayer } from "@/components/AudioPlayer";
import { ModeSelector } from "@/components/ModeSelector";
import { ReaderControls } from "@/components/ReaderControls";
import { ScriptEditor } from "@/components/ScriptEditor";
import { SentenceList } from "@/components/SentenceList";
import { TtsPanel } from "@/components/TtsPanel";
import { useReaderPlayback } from "@/hooks/useReaderPlayback";
import { useReaderStore } from "@/stores/readerStore";

export default function Home() {
  const mode = useReaderStore((s) => s.mode);
  const error = useReaderStore((s) => s.error);
  const playback = useReaderStore((s) => s.playback);

  const {
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
  } = useReaderPlayback();

  const isMp3 = mode === "mp3";

  return (
    <>
      <div className="ambient-blob ambient-blob--purple" aria-hidden />
      <div className="ambient-blob ambient-blob--cyan" aria-hidden />

      <main className="app-shell mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
        <header className="animate-in">
          <span className="badge mb-3">
            {isMp3 ? "Mode 1 · Audio sync" : "Mode 2 · TTS + Gemini"}
          </span>
          <h1 className="header-title text-4xl font-bold tracking-tight sm:text-5xl">
            ENGLISH READER
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
            Learn with rhythm — MP3 sync hoặc giọng AI tự nhiên hơn
          </p>
          <a
            href="https://www.figma.com/design/ExwSmiQBJgtgH6cAAQFM9f"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] transition hover:opacity-80"
          >
            Figma design →
          </a>
        </header>

        <section className="card animate-in animate-in-delay-1">
          <ModeSelector />
        </section>

        <ScriptEditor />

        {isMp3 ? (
          <AudioPlayer
            audioRef={audioRef}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
          />
        ) : (
          <TtsPanel />
        )}

        <div className="animate-in animate-in-delay-4">
          <ReaderControls
            onStart={isMp3 ? startMp3 : startTts}
            onPause={isMp3 ? pauseMp3 : pauseTts}
            onResume={isMp3 ? resumeMp3 : resumeTts}
            onStop={isMp3 ? stopMp3 : stopTts}
            onReadSelection={isMp3 ? undefined : readSelection}
          />
        </div>

        {error && (
          <p className="animate-in rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
            {error}
          </p>
        )}

        {playback !== "idle" && (
          <p className="status-pill animate-in w-fit">
            {playback === "playing" ? (
              <>
                Đang phát
                <span className="playing-indicator">
                  <span />
                  <span />
                  <span />
                </span>
              </>
            ) : (
              "Tạm dừng"
            )}
          </p>
        )}

        <SentenceList
          onSentenceClick={isMp3 ? undefined : () => readSelectedSentence()}
        />
      </main>
    </>
  );
}
