"use client";

import { useRef } from "react";
import { useReaderStore } from "@/stores/readerStore";

type AudioPlayerProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTimeUpdate: () => void;
  onEnded: () => void;
};

export function AudioPlayer({
  audioRef,
  onTimeUpdate,
  onEnded,
}: AudioPlayerProps) {
  const setAudioUrl = useReaderStore((s) => s.setAudioUrl);
  const audioUrl = useReaderStore((s) => s.audioUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };

  return (
    <section className="card animate-in animate-in-delay-3">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
        Upload lesson audio
      </h3>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="upload-zone w-full text-center"
      >
        <span className="text-sm font-semibold text-[var(--color-accent)]">
          {audioUrl ? "Đổi file MP3" : "lesson.mp3"}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          Drop file or click to browse
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          className="mt-4 w-full rounded-lg opacity-90"
          controls
        />
      )}
    </section>
  );
}
