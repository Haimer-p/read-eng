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
