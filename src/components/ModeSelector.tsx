"use client";

import { useReaderStore } from "@/stores/readerStore";
import type { ReaderMode } from "@/types";

const MODES: { id: ReaderMode; label: string; desc: string }[] = [
  { id: "mp3", label: "MP3 Sync", desc: "Script + audio" },
  { id: "tts", label: "AI Voice", desc: "TTS + Gemini" },
];

export function ModeSelector() {
  const mode = useReaderStore((s) => s.mode);
  const setMode = useReaderStore((s) => s.setMode);

  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`pill ${active ? "pill--active" : "pill--idle"}`}
          >
            <span>{m.label}</span>
            <span
              className={`text-[10px] font-normal ${active ? "opacity-90" : "opacity-60"}`}
            >
              {m.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
