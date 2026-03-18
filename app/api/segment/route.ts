import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { segmentPerson, checkSAM2Health } from "@/lib/sam2";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healthy = await checkSAM2Health();
    if (!healthy) {
      return NextResponse.json(
        { error: "SAM 2 server is not running" },
        { status: 503 }
      );
    }

    const { frames, clickPoint } = (await req.json()) as {
      frames: string[];
      clickPoint: { x: number; y: number };
    };

    if (!frames?.length || !clickPoint) {
      return NextResponse.json({ error: "Missing frames or click point" }, { status: 400 });
    }

    const result = await segmentPerson(frames, clickPoint);

    // Extract masks and segmented images separately
    const masks = result.results.map(r => r.mask);
    const segmentedFrames = result.results.map(r => r.segmented);

    return NextResponse.json({ masks, segmentedFrames });
  } catch (error) {
    console.error("Segmentation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Segmentation failed" },
      { status: 500 }
    );
  }
}
