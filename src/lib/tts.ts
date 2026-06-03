export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type SpeedOption = (typeof SPEED_OPTIONS)[number];

export type VoiceLocale = "en-US" | "en-GB" | "en-AU";

export const VOICE_PRESETS: { value: VoiceLocale; label: string; short: string }[] =
  [
    { value: "en-US", label: "US English", short: "US" },
    { value: "en-GB", label: "UK English", short: "UK" },
    { value: "en-AU", label: "AU English", short: "AU" },
  ];

export const VOICE_LANG_OPTIONS = VOICE_PRESETS.map((p) => ({
  value: p.value,
  label: p.label,
}));

const LOCALE_HINTS: Record<VoiceLocale, string[]> = {
  "en-GB": [
    "en-gb",
    "uk",
    "british",
    "george",
    "libby",
    "hazel",
    "ryan",
    "sonia",
    "oliver",
    "microsoft susan",
  ],
  "en-US": [
    "en-us",
    "aria",
    "jenny",
    "guy",
    "zira",
    "david",
    "samantha",
    "microsoft mark",
  ],
  "en-AU": ["en-au", "australian", "natasha", "william", "karen"],
};

const BLOCKED_VOICE_HINTS = ["online", "natural", "neural", "preview"];

const MAX_CHUNK_CHARS = 180;

let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const finish = () => {
        resolve(window.speechSynthesis.getVoices());
        voicesReadyPromise = null;
      };
      window.speechSynthesis.onvoiceschanged = () => finish();
      window.setTimeout(finish, 1200);
    });
  }

  return voicesReadyPromise;
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));
}

function scoreVoice(v: SpeechSynthesisVoice, locale: VoiceLocale): number {
  let score = 0;
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  const target = locale.toLowerCase();

  if (BLOCKED_VOICE_HINTS.some((h) => name.includes(h))) score -= 50;
  if (v.localService) score += 25;
  else score -= 20;

  if (lang === target) score += 20;
  else if (lang.startsWith("en")) score += 5;

  for (const hint of LOCALE_HINTS[locale]) {
    if (name.includes(hint) || lang.includes(hint)) score += 8;
  }

  return score;
}

function normalizeLocale(locale: string): VoiceLocale {
  return VOICE_PRESETS.some((p) => p.value === locale)
    ? (locale as VoiceLocale)
    : "en-US";
}

export function getVoiceCandidates(locale: string): SpeechSynthesisVoice[] {
  const normalized = normalizeLocale(locale);
  const voices = getEnglishVoices();
  if (voices.length === 0) return [];

  const local = voices.filter((v) => v.localService);
  const pool = local.length > 0 ? local : voices;

  return [...pool]
    .sort((a, b) => scoreVoice(b, normalized) - scoreVoice(a, normalized))
    .slice(0, 6);
}

export async function pickVoice(locale: string): Promise<SpeechSynthesisVoice | null> {
  await ensureVoicesLoaded();
  return getVoiceCandidates(locale)[0] ?? null;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampRate(rate: number): number {
  return Math.min(1.75, Math.max(0.75, rate));
}

/** Chuẩn hóa text từ Gemini (ellipsis, ký tự lạ) để TTS ổn định hơn. */
export function sanitizeTextForTts(text: string): string {
  return text
    .replace(/\u2026/g, ". ")
    .replace(/\.{3,}/g, ". ")
    .replace(/\.{2}/g, ". ")
    .replace(/[_*#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chia đoạn dài — Edge/Chrome hay lỗi synthesis-failed với utterance quá dài. */
export function chunkTextForTts(text: string, maxLen = MAX_CHUNK_CHARS): string[] {
  const clean = sanitizeTextForTts(text);
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks: string[] = [];
  let rest = clean;

  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      chunks.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(" ", maxLen);
    if (cut < maxLen * 0.4) cut = maxLen;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  return chunks.filter(Boolean);
}

function resumeSpeechIfPaused(): void {
  const syn = window.speechSynthesis;
  if (syn.paused) syn.resume();
}

export async function waitForSpeechIdle(): Promise<void> {
  const syn = window.speechSynthesis;
  let attempts = 0;
  while ((syn.speaking || syn.pending) && attempts < 200) {
    await wait(50);
    attempts += 1;
  }
}

export async function stopSpeech(): Promise<void> {
  window.speechSynthesis.cancel();
  await wait(200);
}

function isBenignSpeechError(event: SpeechSynthesisErrorEvent): boolean {
  const code = event.error;
  return code === "interrupted" || code === "canceled";
}

type SpeakAttempt = {
  rate: number;
  lang: string;
  voice: SpeechSynthesisVoice | null;
};

function speakOnce(text: string, options: SpeakAttempt): Promise<void> {
  return new Promise((resolve, reject) => {
    const syn = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = clampRate(options.rate);
    utterance.lang = options.lang;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (options.voice) {
      utterance.voice = options.voice;
    }

    let settled = false;
    const finish = (ok: boolean, event?: SpeechSynthesisErrorEvent) => {
      if (settled) return;
      settled = true;
      if (ok || (event && isBenignSpeechError(event))) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Speech synthesis error${event?.error ? `: ${event.error}` : ""}`,
        ),
      );
    };

    utterance.onstart = () => resumeSpeechIfPaused();
    utterance.onend = () => finish(true);
    utterance.onerror = (event) => finish(false, event);

    syn.speak(utterance);
    resumeSpeechIfPaused();

    window.setTimeout(() => {
      if (!settled && !syn.speaking && !syn.pending) {
        finish(true);
      }
    }, 800);
  });
}

function buildAttempts(
  locale: VoiceLocale,
  candidates: SpeechSynthesisVoice[],
): SpeakAttempt[] {
  const attempts: SpeakAttempt[] = [];
  const seen = new Set<string>();

  for (const voice of candidates) {
    const key = voice.voiceURI || voice.name;
    if (seen.has(key)) continue;
    seen.add(key);
    attempts.push({ rate: 1, lang: voice.lang, voice });
  }

  attempts.push({ rate: 1, lang: locale, voice: null });
  attempts.push({ rate: 1, lang: "en-US", voice: null });

  return attempts;
}

async function speakChunkWithFallbacks(
  chunk: string,
  rate: number,
  voiceLang: string,
): Promise<void> {
  const locale = normalizeLocale(voiceLang);
  const candidates = getVoiceCandidates(voiceLang);
  const attempts = buildAttempts(locale, candidates);
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      await waitForSpeechIdle();
      await speakOnce(chunk, { ...attempt, rate });
      return;
    } catch (error) {
      lastError = error;
      await wait(80);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Speech synthesis failed");
}

export async function speakText(
  text: string,
  options: { rate: number; voiceLang: string; cancelFirst?: boolean },
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("Speech synthesis not available");
  }

  const chunks = chunkTextForTts(text);
  if (chunks.length === 0) return;

  await ensureVoicesLoaded();

  if (options.cancelFirst !== false) {
    await stopSpeech();
  }

  for (let i = 0; i < chunks.length; i++) {
    await speakChunkWithFallbacks(chunks[i], options.rate, options.voiceLang);
    if (i < chunks.length - 1) {
      await wait(120);
    }
  }
}

export async function speakSentences(
  sentences: string[],
  options: {
    rate: number;
    voiceLang: string;
    pauseMs?: number;
    onIndex?: (index: number) => void;
    shouldStop?: () => boolean;
  },
): Promise<void> {
  const pauseMs = options.pauseMs ?? 600;

  await ensureVoicesLoaded();
  await stopSpeech();

  for (let i = 0; i < sentences.length; i++) {
    if (options.shouldStop?.()) break;
    options.onIndex?.(i);

    const chunks = chunkTextForTts(sentences[i]);
    for (const chunk of chunks) {
      if (options.shouldStop?.()) break;
      try {
        await speakChunkWithFallbacks(chunk, options.rate, options.voiceLang);
      } catch (error) {
        if (options.shouldStop?.()) break;
        throw error;
      }
      await wait(100);
    }

    if (options.shouldStop?.()) break;
    if (i < sentences.length - 1) {
      await wait(pauseMs);
    }
  }
}
