"use client";

import { VOICE_PRESETS } from "@/lib/tts";
import { useReaderStore } from "@/stores/readerStore";

export function VoiceSelector() {
  const voiceLang = useReaderStore((s) => s.voiceLang);
  const setVoiceLang = useReaderStore((s) => s.setVoiceLang);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Voice
      </span>
      <div className="flex flex-wrap gap-2">
        {VOICE_PRESETS.map((preset) => {
          const active = voiceLang === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => setVoiceLang(preset.value)}
              className={`pill ${active ? "pill--active" : "pill--idle"}`}
              title={preset.label}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--color-muted)]">
        Đang chọn:{" "}
        <span className="text-[var(--color-accent)]">
          {VOICE_PRESETS.find((p) => p.value === voiceLang)?.label ??
            voiceLang}
        </span>
        . Chỉ dùng giọng cài sẵn trên Windows (tránh giọng Online).
      </p>
    </div>
  );
}
