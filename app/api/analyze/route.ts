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
    const {
      frames,
      masks,
      segmentedFrames,
      poses,
      lane,
      videoUrl,
      thumbnailBase64,
    } = body as {
      frames: string[];
      masks?: string[];
      segmentedFrames?: string[];
      poses?: Array<Array<{ x: number; y: number; z: number; visibility: number }>>;
      lane?: number;
      videoUrl?: string;
      thumbnailBase64: string | null;
    };

    if (!frames?.length) {
      return NextResponse.json({ error: "No frames provided" }, { status: 400 });
    }

    // Call GPT-4o for analysis
    const result = await analyzeSwimming(frames, lane);

    const validStrokes = ["freestyle", "breaststroke", "butterfly", "backstroke"];
    const detectedStroke = validStrokes.includes(result.detected_stroke)
      ? result.detected_stroke
      : "freestyle";

    // Save to Supabase
    const saved = await saveAnalysis({
      user_id: userId,
      stroke_type: detectedStroke as "freestyle" | "breaststroke" | "butterfly" | "backstroke",
      overall_score: result.overall_score,
      dimension_scores: result.dimension_scores,
      issues: result.issues,
      keyframe_poses: poses || [],
      keyframe_images: frames,
      segmentation_masks: masks || null,
      video_url: videoUrl || null,
      thumbnail_base64: thumbnailBase64,
    });

    return NextResponse.json({
      analysis: {
        ...saved,
        segmented_frames: segmentedFrames || [],
        frame_notes: result.frame_notes || [],
        summary: result.summary || "",
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
