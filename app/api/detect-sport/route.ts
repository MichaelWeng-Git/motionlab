import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { detectSport } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frames } = (await req.json()) as { frames: string[] };
    if (!frames?.length) {
      return NextResponse.json({ error: "No frames provided" }, { status: 400 });
    }

    const result = await detectSport(frames);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sport detection error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Detection failed" },
      { status: 500 }
    );
  }
}
