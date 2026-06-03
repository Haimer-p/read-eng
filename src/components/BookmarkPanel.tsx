"use client";

import { useEffect } from "react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useReaderStore } from "@/stores/readerStore";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BookmarkPanel() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const isLoading = useBookmarkStore((s) => s.isLoading);
  const isSaving = useBookmarkStore((s) => s.isSaving);
  const saveTitle = useBookmarkStore((s) => s.saveTitle);
  const message = useBookmarkStore((s) => s.message);
  const fetchBookmarks = useBookmarkStore((s) => s.fetchBookmarks);
  const saveCurrentAsBookmark = useBookmarkStore((s) => s.saveCurrentAsBookmark);
  const applyBookmark = useBookmarkStore((s) => s.applyBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const setSaveTitle = useBookmarkStore((s) => s.setSaveTitle);
  const clearMessage = useBookmarkStore((s) => s.clearMessage);

  const script = useReaderStore((s) => s.script);
  const selectedIndex = useReaderStore((s) => s.selectedIndex);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return (
    <section className="card animate-in animate-in-delay-1">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Bookmarks
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            Lưu bài đọc và cài đặt để mở lại sau
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-xs"
          onClick={() => fetchBookmarks()}
          disabled={isLoading}
        >
          Làm mới
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="Tên bookmark (để trống = tự đặt từ câu đầu)"
          className="input-glass flex-1"
        />
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => saveCurrentAsBookmark()}
          disabled={isSaving || !script.trim()}
        >
          {isSaving ? "Đang lưu…" : "Lưu bookmark"}
        </button>
      </div>

      {selectedIndex !== null && (
        <p className="mb-3 text-xs text-[var(--color-accent)]">
          Sẽ lưu kèm vị trí câu đang chọn (#{selectedIndex + 1})
        </p>
      )}

      {message && (
        <p
          className="mb-3 rounded-lg border border-[var(--color-border)] bg-[rgba(124,92,255,0.1)] px-3 py-2 text-xs text-[var(--color-text)]"
          role="status"
        >
          {message}
          <button
            type="button"
            className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            onClick={clearMessage}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải bookmarks…</p>
      ) : bookmarks.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          Chưa có bookmark. Nhập script và nhấn &quot;Lưu bookmark&quot;.
        </p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-3 transition hover:border-[rgba(124,92,255,0.35)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm text-[var(--color-text)]">
                    {b.title}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                    {b.mode === "mp3" ? "MP3" : "TTS"}
                    {b.useAiEnhancement && b.mode === "tts" ? " · AI" : ""}
                    {" · "}
                    {formatDate(b.updatedAt)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                    {b.script.split("\n")[0]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-1.5 text-xs"
                    onClick={() => applyBookmark(b)}
                  >
                    Mở
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => removeBookmark(b.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
