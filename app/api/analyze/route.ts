import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeSwimming } from "@/lib/openai";
import { saveAnalysis } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { strokeType, frames, poses, thumbnailBase64 } = body as {
      strokeType: string;
      frames: string[];
      poses: Array<Array<{ x: number; y: number; z: number; visibility: number }>>;
      thumbnailBase64: string | null;
    };

    if (!strokeType || !frames?.length || !poses?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call GPT-4o for analysis
    const analysisResult = await analyzeSwimming(strokeType, frames, poses);

    // Save to Supabase
    const saved = await saveAnalysis({
      user_id: userId,
      stroke_type: strokeType as "freestyle" | "breaststroke" | "butterfly" | "backstroke",
      overall_score: analysisResult.overall_score,
      dimension_scores: analysisResult.dimension_scores,
      issues: analysisResult.issues,
      keyframe_poses: poses,
      thumbnail_base64: thumbnailBase64,
    });

    return NextResponse.json({ analysis: saved });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
