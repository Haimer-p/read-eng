"use client";

import { VOICE_LANG_OPTIONS } from "@/lib/tts";
import { useReaderStore } from "@/stores/readerStore";

export function VoiceSelector() {
  const voiceLang = useReaderStore((s) => s.voiceLang);
  const setVoiceLang = useReaderStore((s) => s.setVoiceLang);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="voice-lang"
        className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
      >
        Voice
      </label>
      <select
        id="voice-lang"
        value={voiceLang}
        onChange={(e) => setVoiceLang(e.target.value)}
        className="input-glass"
      >
        {VOICE_LANG_OPTIONS.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}
