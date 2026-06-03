import { NextResponse } from "next/server";
import { getCachedEnhancement, saveCachedEnhancement } from "@/lib/cache";
import { enhanceScript } from "@/lib/gemini";
import type { EnhanceResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { script?: string };
    const script = body.script?.trim();

    if (!script) {
      return NextResponse.json(
        { error: "script is required" },
        { status: 400 },
      );
    }

    const cached = await getCachedEnhancement(script);
    if (cached) {
      const payload: EnhanceResponse = {
        enhancedText: cached.enhancedText,
        cached: true,
      };
      return NextResponse.json(payload);
    }

    const enhancedText = await enhanceScript(script);
    await saveCachedEnhancement(script, enhancedText);

    const payload: EnhanceResponse = {
      enhancedText,
      cached: false,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enhancement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
