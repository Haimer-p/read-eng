import { ObjectId } from "mongodb";
import type { Bookmark, BookmarkDocument, ReaderMode } from "@/types";
import { defaultBookmarkTitle } from "./bookmark-utils";
import { getDb } from "./mongo";

export { defaultBookmarkTitle };

const COLLECTION = "bookmarks";

let bookmarkIndexesEnsured = false;

export async function ensureBookmarkIndexes(): Promise<void> {
  if (bookmarkIndexesEnsured) return;
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  await collection.createIndex({ updatedAt: -1 });
  bookmarkIndexesEnsured = true;
}

function toBookmark(doc: BookmarkDocument & { _id: ObjectId }): Bookmark {
  return {
    id: doc._id.toString(),
    title: doc.title,
    script: doc.script,
    enhancedScript: doc.enhancedScript,
    mode: doc.mode,
    speed: doc.speed,
    voiceLang: doc.voiceLang,
    useAiEnhancement: doc.useAiEnhancement,
    selectedSentenceIndex: doc.selectedSentenceIndex,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listBookmarks(): Promise<Bookmark[]> {
  await ensureBookmarkIndexes();
  const db = await getDb();
  const docs = await db
    .collection<BookmarkDocument>(COLLECTION)
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.map((doc) =>
    toBookmark(doc as BookmarkDocument & { _id: ObjectId }),
  );
}

export type CreateBookmarkInput = {
  title?: string;
  script: string;
  enhancedScript?: string;
  mode: ReaderMode;
  speed: number;
  voiceLang: string;
  useAiEnhancement: boolean;
  selectedSentenceIndex?: number | null;
};

export async function createBookmark(
  input: CreateBookmarkInput,
): Promise<Bookmark> {
  await ensureBookmarkIndexes();
  const now = new Date().toISOString();
  const doc: BookmarkDocument = {
    title: input.title?.trim() || defaultBookmarkTitle(input.script),
    script: input.script,
    enhancedScript: input.enhancedScript ?? "",
    mode: input.mode,
    speed: input.speed,
    voiceLang: input.voiceLang,
    useAiEnhancement: input.useAiEnhancement,
    selectedSentenceIndex: input.selectedSentenceIndex ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const result = await db.collection(COLLECTION).insertOne(doc);
  return toBookmark({ ...doc, _id: result.insertedId });
}

export async function deleteBookmark(id: string): Promise<boolean> {
  await ensureBookmarkIndexes();
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const result = await db
    .collection(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
