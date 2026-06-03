import { NextResponse } from "next/server";
import { getCachedEnhancement, saveCachedEnhancement } from "@/lib/cache";
import {
  canCallEnhanceApi,
  markEnhanceApiCalled,
  withEnhanceInFlight,
} from "@/lib/enhance-guard";
import { enhanceScript } from "@/lib/gemini";
import type { EnhanceResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      script?: string;
      clientKeys?: string[];
    };
    const script = body.script?.trim();
    const clientKeys = Array.isArray(body.clientKeys)
      ? body.clientKeys.filter((k): k is string => typeof k === "string")
      : [];

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

    const guard = canCallEnhanceApi(script);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 429 });
    }

    const enhancedText = await withEnhanceInFlight(script, async () => {
      const text = await enhanceScript(script, clientKeys);
      markEnhanceApiCalled(script);
      await saveCachedEnhancement(script, text);
      return text;
    });

    const payload: EnhanceResponse = {
      enhancedText,
      cached: false,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enhancement failed";
    const status =
      error instanceof Error && message.includes("quota") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
