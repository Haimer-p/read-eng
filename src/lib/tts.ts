export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type SpeedOption = (typeof SPEED_OPTIONS)[number];

export const VOICE_LANG_OPTIONS = [
  { value: "en-US", label: "en-US" },
  { value: "en-GB", label: "en-GB" },
  { value: "en-AU", label: "en-AU" },
] as const;

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("en"));
}

export function pickVoice(langPrefix: string): SpeechSynthesisVoice | null {
  const voices = getEnglishVoices();
  const exact = voices.find((v) => v.lang === langPrefix);
  if (exact) return exact;
  return voices.find((v) => v.lang.startsWith(langPrefix.split("-")[0])) ?? voices[0] ?? null;
}

export function speakText(
  text: string,
  options: { rate: number; voice: SpeechSynthesisVoice | null },
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech synthesis not available"));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate;
    if (options.voice) utterance.voice = options.voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("Speech synthesis error"));
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakSentences(
  sentences: string[],
  options: {
    rate: number;
    voice: SpeechSynthesisVoice | null;
    pauseMs?: number;
    onIndex?: (index: number) => void;
    shouldStop?: () => boolean;
  },
): Promise<void> {
  const pauseMs = options.pauseMs ?? 500;

  for (let i = 0; i < sentences.length; i++) {
    if (options.shouldStop?.()) break;
    options.onIndex?.(i);
    await speakText(sentences[i], {
      rate: options.rate,
      voice: options.voice,
    });
    if (options.shouldStop?.()) break;
    if (i < sentences.length - 1) {
      await wait(pauseMs);
    }
  }
}
