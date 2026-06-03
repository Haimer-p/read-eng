"use client";

import { useReaderStore } from "@/stores/readerStore";

export function ScriptEditor() {
  const script = useReaderStore((s) => s.script);
  const setScript = useReaderStore((s) => s.setScript);

  return (
    <section className="card animate-in animate-in-delay-2">
      <label
        htmlFor="script"
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
      >
        Script
      </label>
      <textarea
        id="script"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder={"Hello everyone.\n\nToday we are learning English.\n\nThank you."}
        rows={8}
        className="input-glass"
      />
    </section>
  );
}
