import { NextResponse } from "next/server";
import { deleteBookmark } from "@/lib/bookmarks";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ok = await deleteBookmark(id);
    if (!ok) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete bookmark";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
