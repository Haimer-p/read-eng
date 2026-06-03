export function splitSentences(script: string): string[] {
  return script
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitEnhancedSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
