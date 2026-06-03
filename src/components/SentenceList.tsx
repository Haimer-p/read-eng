"use client";

import { useReaderStore } from "@/stores/readerStore";

type SentenceListProps = {
  onSentenceClick?: (index: number) => void;
};

export function SentenceList({ onSentenceClick }: SentenceListProps) {
  const sentences = useReaderStore((s) => s.sentences);
  const currentIndex = useReaderStore((s) => s.currentIndex);
  const selectedIndex = useReaderStore((s) => s.selectedIndex);
  const playback = useReaderStore((s) => s.playback);
  const selectSentence = useReaderStore((s) => s.selectSentence);

  if (sentences.length === 0) {
    return (
      <section className="card animate-in animate-in-delay-5 text-sm text-[var(--color-muted)]">
        Nhập script để hiển thị live transcript.
      </section>
    );
  }

  return (
    <section className="card animate-in animate-in-delay-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Live transcript
      </h3>
      <ul className="flex flex-col gap-2">
        {sentences.map((sentence, index) => {
          const isCurrent = index === currentIndex;
          const isSelected = index === selectedIndex;
          const showPulse = isCurrent && playback !== "idle";

          return (
            <li
              key={`${index}-${sentence.slice(0, 12)}`}
              className="animate-in"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <button
                type="button"
                onClick={() => {
                  selectSentence(index);
                  onSentenceClick?.(index);
                }}
                className={`w-full rounded-xl px-3.5 py-3 text-left text-sm transition-all duration-300 ${
                  showPulse
                    ? "sentence-active"
                    : isSelected
                      ? "border border-[var(--color-primary)] bg-[rgba(124,92,255,0.12)] text-[var(--color-text)]"
                      : "border border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {sentence}
                {showPulse && (
                  <span className="playing-indicator" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
