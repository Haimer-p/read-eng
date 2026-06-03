Thiết kế này hoàn toàn khả thi với chi phí gần như 0 đồng.

## Kiến trúc tổng thể

```

```

```
Next.js 15
│
├── App Router
├── Tailwind
├── Zustand
├── MongoDB Atlas Free
│
├── Mode 1: Script + MP3 Sync
│   ├── Audio Player
│   ├── Transcript Viewer
│   └── Highlight Current Sentence
│
├── Mode 2: Script + TTS
│   ├── Web Speech API
│   ├── Gemini Enhancement
│   └── Reading Controller
│
├── AI Key Manager
│   ├── Gemini Key #1
│   ├── Gemini Key #2
│   ├── Gemini Key #3
│   └── Auto Failover
│
└── Cache Layer
    └── Mongo Atlas
```

---

# Database Design (Mongo Atlas)

Collection: `tts_cache`

```

```

```
{
  _id: ObjectId,

  originalText: String,

  enhancedText: String,

  hash: String,

  aiProvider: "gemini",

  createdAt: Date,

  expiresAt: Date
}
```

index

```

```

```
db.tts_cache.createIndex(
  { hash: 1 },
  { unique: true }
)
```

TTL

```

```

```
db.tts_cache.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)
```

Cache 30 ngày.

---

# UI

```

```

```
+--------------------------------+
|        ENGLISH READER          |
+--------------------------------+

(O) Mode 1: Script + MP3

(O) Mode 2: Script + TTS

----------------------------------

[ Paste Script ]

----------------------------------

Mode 1:

[ Upload MP3 ]

----------------------------------

Mode 2:

☑ Use AI Enhancement

Reading Speed:
0.5x 0.75x 1x 1.25x 1.5x

Voice:
en-US
en-GB
en-AU

----------------------------------

[ Start ]
[ Pause ]
[ Resume ]
[ Stop ]
```

---

# MODE 1

## Input

User nhập:

```

```

```
Hello everyone.

Today we are learning English.

Thank you.
```

upload:

```

```

```
lesson.mp3
```

---

## Cách sync

Không dùng AI.

Chỉ cần tách script:

```

```

```
const sentences = script
  .split(/\n+/)
  .filter(Boolean);
```

Khi audio chạy:

```

```

```
audio.currentTime
```

highlight câu tương ứng.

---

### Option nâng cấp

Gemini sinh timestamps.

Ví dụ:

```

```

```
[
  {
    "text":"Hello everyone",
    "start":0,
    "end":2
  },
  {
    "text":"Today we are learning English",
    "start":2,
    "end":6
  }
]
```

Nhưng free sẽ tốn quota.

Giai đoạn đầu bỏ qua.

---

# MODE 2

Đây là phần quan trọng.

## Không dùng AI

Script

```

```

```
I can't believe you did that.
```

đưa thẳng vào

```

```

```
speechSynthesis.speak()
```

---

## Có dùng AI

Flow:

```

```

```
Original Script
        │
        ▼
Gemini
        │
        ▼
Enhanced Script
        │
        ▼
Web Speech API
```

---

# Prompt Gemini

System:

```

```

```
You are an expert speech editor.

Your task:

1. Keep all words unchanged.
2. Never add new information.
3. Improve punctuation.
4. Add pauses.
5. Add emphasis with capitalization.
6. Split long sentences.

Return plain text only.
```

User:

```

```

```
I can't believe you did that.
```

Output:

```

```

```
I can't believe...

you did THAT!
```

---

Ví dụ khác

Input:

```

```

```
The weather is beautiful today and I think we should go outside.
```

Output:

```

```

```
The weather is BEAUTIFUL today...

and I think we should go outside.
```

Web Speech API đọc tự nhiên hơn đáng kể.

---

# AI Key Rotation

Collection:

```

```

```
{
  _id:ObjectId,

  key:"AIza....",

  active:true,

  lastUsedAt:Date,

  errorCount:0
}
```

---

Service:

```

```

```
class GeminiKeyManager {

  async getNextKey() {}

  async markSuccess() {}

  async markFailed() {}

}
```

---

Logic

```

```

```
Key 1
 ↓ fail
Key 2
 ↓ fail
Key 3
 ↓ fail
Error
```

Pseudo:

```

```

```
for (const key of keys) {

   try {

      return await callGemini(key)

   } catch {

      continue

   }

}
```

---

Các lỗi cần fallback:

```

```

```
429
quota exceeded

403
key disabled

500
internal error

503
overloaded
```

---

# Cache AI Result

Hash script.

```

```

```
import crypto from "crypto"

const hash =
crypto
.createHash("sha256")
.update(script)
.digest("hex")
```

---

Flow

```

```

```
Script
  │
  ▼
Hash
  │
  ▼
Mongo Cache
  │
  ├── Found
  │      ▼
  │   Return
  │
  └── Not Found
          ▼
      Gemini
          ▼
      Save Cache
```

---

# TTS Engine

Dùng:

```

```

```
window.speechSynthesis.getVoices()
```

Lấy toàn bộ voice.

Ví dụ:

```

```

```
Google US English

Google UK English Female

Microsoft Aria Online

Microsoft Jenny Online

Microsoft Guy Online
```

---

Filter:

```

```

```
voice.lang.startsWith("en")
```

---

# Speed Control

```

```

```
utterance.rate = speed
```

Range

```

```

```
0.5x
0.75x
1x
1.25x
1.5x
2x
```

---

# Chỉ đọc đoạn được chọn

Giống TTSReader.

User click:

```

```

```
Sentence 1

Sentence 2

Sentence 3
```

---

State

```

```

```
selectedSentence
```

---

Read

```

```

```
const utterance =
new SpeechSynthesisUtterance(
 selectedSentence
)
```

---

Hoặc drag chọn text.

```

```

```
window.getSelection()
```

để đọc riêng đoạn bôi đen.

---

# Cấu trúc NextJS

```

```

```
src

├── app

│   ├── page.tsx

│   ├── api
│   │   ├── enhance
│   │   └── voices

├── components

│   ├── ScriptEditor.tsx
│   ├── AudioPlayer.tsx
│   ├── ReaderControls.tsx
│   ├── SentenceList.tsx
│   └── VoiceSelector.tsx

├── lib

│   ├── gemini.ts
│   ├── key-manager.ts
│   ├── cache.ts
│   └── mongo.ts

├── stores

│   └── readerStore.ts

└── types
```

---

# Nâng cấp "đáng tiền" nhất

Nếu muốn ngữ điệu tốt hơn Web Speech API mà vẫn miễn phí:

1.   
Gemini chỉnh ngữ điệu.  

2.   
Chia nhỏ theo câu.  

3.   
Đọc từng câu riêng.  


Ví dụ thay vì:

```

```

```
I can't believe you did that. What were you thinking?
```

đọc một lần.

Hãy:

```

```

```
I can't believe you did that.

[pause 500ms]

What were you THINKING?
```

Code:

```

```

```
for (const sentence of sentences) {

   speechSynthesis.speak(
      new SpeechSynthesisUtterance(sentence)
   )

   await wait(500)
}
```

Cách này thường cải thiện cảm giác tự nhiên nhiều hơn việc chỉ gọi `speechSynthesis.speak()` trên cả đoạn văn dài.

### MVP nên triển khai trước

-   
✅ Next.js  

-   
✅ Mongo Atlas cache  

-   
✅ Mode 1 (MP3 + Script)  

-   
✅ Mode 2 (Web Speech API)  

-   
✅ Gemini Enhancement  

-   
✅ Multi Gemini Keys + Auto Failover  

-   
✅ Sentence Selection  

-   
✅ Speed Control  

-   
✅ Highlight câu đang đọc  

-   
✅ Cache AI Result  


Sau khi MVP chạy ổn, hãy bổ sung:

-   
Đồng bộ timestamp tự động cho MP3.  

-   
Xuất file SRT.  

-   
Lưu thư viện bài đọc.  

-   
Chế độ Shadowing (nghe từng câu rồi lặp lại). Đây là tính năng rất phù hợp với đối tượng học tiếng Anh.

