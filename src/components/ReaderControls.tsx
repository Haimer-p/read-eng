"use client";

import { useReaderStore } from "@/stores/readerStore";

type ReaderControlsProps = {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReadSelection?: () => void;
};

export function ReaderControls({
  onStart,
  onPause,
  onResume,
  onStop,
  onReadSelection,
}: ReaderControlsProps) {
  const playback = useReaderStore((s) => s.playback);
  const isEnhancing = useReaderStore((s) => s.isEnhancing);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onStart}
        disabled={isEnhancing}
      >
        Start
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onPause}
        disabled={playback !== "playing"}
      >
        Pause
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onResume}
        disabled={playback !== "paused"}
      >
        Resume
      </button>
      <button type="button" className="btn btn-secondary" onClick={onStop}>
        Stop
      </button>
      {onReadSelection && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReadSelection}
        >
          Read Selection
        </button>
      )}
    </div>
  );
}
