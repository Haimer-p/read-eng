export type ReaderMode = "mp3" | "tts";

export type TtsCacheDocument = {
  _id?: string;
  originalText: string;
  enhancedText: string;
  hash: string;
  aiProvider: "gemini";
  createdAt: Date;
  expiresAt: Date;
};

export type EnhanceResponse = {
  enhancedText: string;
  cached: boolean;
};

export type Bookmark = {
  id: string;
  title: string;
  script: string;
  enhancedScript: string;
  mode: ReaderMode;
  speed: number;
  voiceLang: string;
  useAiEnhancement: boolean;
  selectedSentenceIndex: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BookmarkDocument = Omit<Bookmark, "id"> & {
  _id?: import("mongodb").ObjectId;
};
