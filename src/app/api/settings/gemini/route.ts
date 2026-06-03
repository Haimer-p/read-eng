import { NextResponse } from "next/server";
import { countEnvGeminiKeys } from "@/lib/key-manager";

export async function GET() {
  return NextResponse.json({
    envKeyCount: countEnvGeminiKeys(),
    hint: "Key từ .env.local dùng trên server; key thêm trên màn hình gửi kèm mỗi lần enhance.",
  });
}
