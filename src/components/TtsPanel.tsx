"use client";

import { SPEED_OPTIONS, type SpeedOption } from "@/lib/tts";
import { useReaderStore } from "@/stores/readerStore";
import { VoiceSelector } from "./VoiceSelector";

export function TtsPanel() {
  const useAiEnhancement = useReaderStore((s) => s.useAiEnhancement);
  const setUseAiEnhancement = useReaderStore((s) => s.setUseAiEnhancement);
  const speed = useReaderStore((s) => s.speed);
  const setSpeed = useReaderStore((s) => s.setSpeed);
  const isEnhancing = useReaderStore((s) => s.isEnhancing);

  return (
    <section className="card animate-in animate-in-delay-3">
      <label className="mb-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={useAiEnhancement}
          onChange={(e) => setUseAiEnhancement(e.target.checked)}
          className="h-4 w-4 rounded accent-[var(--color-primary)]"
        />
        <span className="text-[var(--color-accent)]">✦</span>
        Use AI Enhancement
        {isEnhancing && (
          <span className="ml-1 text-xs font-normal text-[var(--color-muted)] animate-pulse">
            đang xử lý…
          </span>
        )}
      </label>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Reading speed
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s as SpeedOption)}
            className={`pill ${speed === s ? "pill--active" : "pill--idle"}`}
          >
            {s}x
          </button>
        ))}
      </div>

      <VoiceSelector />
    </section>
  );
}
