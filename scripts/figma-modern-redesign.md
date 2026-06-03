# Figma modern redesign (chạy khi hết MCP rate limit)

File: https://www.figma.com/design/ExwSmiQBJgtgH6cAAQFM9f

**Lưu ý:** Các frame cũ đã bị xóa trong lần redesign trước. Khi MCP Figma khả dụng lại, nhờ agent chạy lại skill `figma-use` + `figma-generate-design` với nội dung:

## Visual

- Nền gradient tím–xanh đậm, blob blur (purple + cyan)
- Card glass: `BACKGROUND_BLUR` 24px, fill trắng 6%, border 12%
- Nút primary gradient `#7c5cff` → `#3b82f6`, shadow glow
- Pills mode MP3 / AI Voice
- Câu đang đọc: highlight hồng + drop shadow pulse

## 3 frames (400×880, x: 0 / 440 / 880)

1. `01 — Mode MP3` — upload dashed cyan
2. `02 — Mode AI Voice` — speed pills, AI badge
3. `03 — Reading` — sentence index 1 highlighted

## Prototype (Smart Animate)

- `StartButton` trên frame 01 & 02 → `NAVIGATE` → frame 03
- Transition: `SMART_ANIMATE`, easing `GENTLE`, duration `0.45`

## Khớp code

Token CSS trong `src/app/globals.css` đã đồng bộ với palette trên.
