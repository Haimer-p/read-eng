"use client";

import { useEffect, useState } from "react";
import { maskGeminiKey } from "@/lib/gemini-key-storage";
import { useGeminiKeyStore } from "@/stores/geminiKeyStore";

export function GeminiKeySettings() {
  const [open, setOpen] = useState(false);
  const keys = useGeminiKeyStore((s) => s.keys);
  const envKeyCount = useGeminiKeyStore((s) => s.envKeyCount);
  const draftKey = useGeminiKeyStore((s) => s.draftKey);
  const draftLabel = useGeminiKeyStore((s) => s.draftLabel);
  const message = useGeminiKeyStore((s) => s.message);
  const hydrate = useGeminiKeyStore((s) => s.hydrate);
  const fetchEnvKeyCount = useGeminiKeyStore((s) => s.fetchEnvKeyCount);
  const setDraftKey = useGeminiKeyStore((s) => s.setDraftKey);
  const setDraftLabel = useGeminiKeyStore((s) => s.setDraftLabel);
  const addKey = useGeminiKeyStore((s) => s.addKey);
  const removeKey = useGeminiKeyStore((s) => s.removeKey);
  const clearMessage = useGeminiKeyStore((s) => s.clearMessage);

  useEffect(() => {
    hydrate();
    void fetchEnvKeyCount();
  }, [hydrate, fetchEnvKeyCount]);

  const totalKeys = keys.length + (envKeyCount ?? 0);

  return (
    <section className="card animate-in">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Cài đặt Gemini API
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            {totalKeys > 0
              ? `${keys.length} key trên máy${envKeyCount ? ` + ${envKeyCount} key .env` : ""}`
              : "Thêm API key để dùng AI Enhancement"}
          </p>
        </div>
        <span className="text-[var(--color-muted)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
          <p className="text-xs text-[var(--color-muted)]">
            Lấy key miễn phí tại{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Google AI Studio
            </a>
            . Key nhập ở đây lưu trong trình duyệt (localStorage), ưu tiên
            trước key trong <code className="text-[10px]">.env.local</code>.
          </p>

          {envKeyCount !== null && envKeyCount > 0 && (
            <p className="rounded-lg border border-[var(--color-border)] bg-[rgba(124,92,255,0.08)] px-3 py-2 text-xs text-[var(--color-muted)]">
              Server đang có {envKeyCount} key từ file .env.local (không hiển
              thị nội dung).
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="Dán Gemini API key (AIza… hoặc AQ.…)"
              className="input-glass flex-1"
              autoComplete="off"
            />
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="Nhãn (tuỳ chọn)"
              className="input-glass sm:w-36"
            />
            <button type="button" className="btn btn-primary shrink-0" onClick={addKey}>
              Thêm key
            </button>
          </div>

          {message && (
            <p className="text-xs text-[var(--color-accent)]">
              {message}
              <button
                type="button"
                className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                onClick={clearMessage}
              >
                ×
              </button>
            </p>
          )}

          {keys.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Chưa có key trên màn hình. Bạn vẫn có thể dùng key trong .env.local.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {k.label}
                    </p>
                    <p className="font-mono text-xs text-[var(--color-muted)]">
                      {maskGeminiKey(k.key)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => removeKey(k.id)}
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
