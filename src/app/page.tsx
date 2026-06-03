"use client";

import { AppLogo } from "@/components/AppLogo";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BookmarkPanel } from "@/components/BookmarkPanel";
import { GeminiKeySettings } from "@/components/GeminiKeySettings";
import { ModeSelector } from "@/components/ModeSelector";
import { ReaderControls } from "@/components/ReaderControls";
import { ScriptEditor } from "@/components/ScriptEditor";
import { SentenceList } from "@/components/SentenceList";
import { TtsPanel } from "@/components/TtsPanel";
import { useReaderPlayback } from "@/hooks/useReaderPlayback";
import { useReaderStore } from "@/stores/readerStore";

function playbackStatusLabel(
  playback: string,
  scope: string,
): string | null {
  if (playback === "idle") return null;
  if (playback === "paused") return "Tạm dừng";
  if (scope === "full") return "Đang đọc toàn bộ";
  if (scope === "sentence") return "Đang nghe câu chọn";
  if (scope === "selection") return "Đang đọc vùng bôi đen";
  return "Đang phát";
}

export default function Home() {
  const mode = useReaderStore((s) => s.mode);
  const error = useReaderStore((s) => s.error);
  const playback = useReaderStore((s) => s.playback);
  const playbackScope = useReaderStore((s) => s.playbackScope);

  const {
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
  } = useReaderPlayback();

  const isMp3 = mode === "mp3";
  const statusLabel = playbackStatusLabel(playback, playbackScope);

  return (
    <>
      <div className="ambient-blob ambient-blob--purple" aria-hidden />
      <div className="ambient-blob ambient-blob--cyan" aria-hidden />

      <main className="app-shell mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
        <header className="animate-in">
          <span className="badge mb-4">
            {isMp3 ? "Mode 1 · Audio sync" : "Mode 2 · TTS + Gemini"}
          </span>
          <AppLogo size={56} showWordmark className="mb-3" />
          <p className="max-w-md text-sm text-[var(--color-muted)]">
            MP3 sync hoặc giọng AI tự nhiên hơn — học tiếng Anh theo nhịp
          </p>
        </header>

        <BookmarkPanel />

        <GeminiKeySettings />

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
          <TtsPanel onEnhance={() => void requestEnhance()} />
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

        {statusLabel && (
          <p className="status-pill animate-in w-fit">
            {playback === "playing" ? (
              <>
                {statusLabel}
                <span className="playing-indicator">
                  <span />
                  <span />
                  <span />
                </span>
              </>
            ) : (
              statusLabel
            )}
          </p>
        )}

        <SentenceList
          onSentenceClick={
            isMp3 ? undefined : (index) => void playSentenceAt(index)
          }
        />
      </main>
    </>
  );
}
