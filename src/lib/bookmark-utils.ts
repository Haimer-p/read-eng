export function defaultBookmarkTitle(script: string): string {
  const first = script
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return first?.slice(0, 80) || "Bài đọc không tên";
}
