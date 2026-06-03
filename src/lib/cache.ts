import { createHash } from "crypto";
import type { TtsCacheDocument } from "@/types";
import { ensureIndexes, getDb } from "./mongo";

const CACHE_DAYS = 30;

export function hashScript(script: string): string {
  return createHash("sha256").update(script).digest("hex");
}

export async function getCachedEnhancement(
  script: string,
): Promise<TtsCacheDocument | null> {
  await ensureIndexes();
  const db = await getDb();
  const hash = hashScript(script);
  const doc = await db.collection<TtsCacheDocument>("tts_cache").findOne({ hash });
  return doc;
}

export async function saveCachedEnhancement(
  originalText: string,
  enhancedText: string,
): Promise<void> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + CACHE_DAYS);

  const doc: TtsCacheDocument = {
    originalText,
    enhancedText,
    hash: hashScript(originalText),
    aiProvider: "gemini",
    createdAt: now,
    expiresAt,
  };

  await db.collection<TtsCacheDocument>("tts_cache").updateOne(
    { hash: doc.hash },
    { $set: doc },
    { upsert: true },
  );
}
