import { NextResponse } from "next/server";
import {
  createBookmark,
  listBookmarks,
  type CreateBookmarkInput,
} from "@/lib/bookmarks";
import type { ReaderMode } from "@/types";

export async function GET() {
  try {
    const bookmarks = await listBookmarks();
    return NextResponse.json({ bookmarks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookmarkInput & {
      title?: string;
    };

    if (!body.script?.trim()) {
      return NextResponse.json(
        { error: "script is required" },
        { status: 400 },
      );
    }

    const bookmark = await createBookmark({
      title: body.title,
      script: body.script.trim(),
      enhancedScript: body.enhancedScript,
      mode: (body.mode as ReaderMode) ?? "mp3",
      speed: body.speed ?? 1,
      voiceLang: body.voiceLang ?? "en-US",
      useAiEnhancement: body.useAiEnhancement ?? true,
      selectedSentenceIndex: body.selectedSentenceIndex ?? null,
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save bookmark";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
