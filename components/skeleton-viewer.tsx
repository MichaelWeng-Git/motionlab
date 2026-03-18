"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { POSE_CONNECTIONS } from "@/lib/skeleton-data";

type PoseLandmark = { x: number; y: number; z: number; visibility?: number };

type ViewMode = "original" | "segmented" | "skeleton";

type Props = {
  frames?: string[];
  masks?: string[];
  poses?: PoseLandmark[][];
  segmentedFrames?: string[];
  issues?: Array<{ part: string; description: string; suggestion: string; frame_index?: number }>;
  highlightPart?: string | null;
};

function drawSkeletonOnCtx(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  dx: number, dy: number, dw: number, dh: number
) {
  // Connections
  ctx.lineWidth = 3;
  for (const [a, b] of POSE_CONNECTIONS) {
    if (a >= landmarks.length || b >= landmarks.length) continue;
    const la = landmarks[a];
    const lb = landmarks[b];
    if ((la.visibility ?? 1) < 0.4 || (lb.visibility ?? 1) < 0.4) continue;

    const ax = dx + la.x * dw, ay = dy + la.y * dh;
    const bx = dx + lb.x * dw, by = dy + lb.y * dh;

    // Shadow
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Green line
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Joints
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if ((lm.visibility ?? 1) < 0.4) continue;
    const x = dx + lm.x * dw;
    const y = dy + lm.y * dh;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff88";
    ctx.fill();
  }
}

export default function SkeletonViewer({
  frames = [], masks = [], poses = [], segmentedFrames = [],
  issues = [], highlightPart = null,
}: Props) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalFrames = frames.length;

  const hasMasks = masks.some(m => m?.length > 0);
  const hasSegmented = segmentedFrames.some(s => s?.length > 0);
  const hasPoses = poses.some(p => p?.some(lm => (lm?.visibility ?? 0) > 0.3));

  // Auto-detect best view
  useEffect(() => {
    if (hasSegmented || hasMasks) setViewMode("segmented");
  }, [hasSegmented, hasMasks]);

  const highlightedIssue = issues.find((i) => i.part === highlightPart);
  useEffect(() => {
    if (highlightedIssue?.frame_index !== undefined) {
      setFrameIndex(highlightedIssue.frame_index);
      setIsPlaying(false);
    }
  }, [highlightPart, highlightedIssue]);

  // Run pose detection on segmented frames in background
  const [detectedPoses, setDetectedPoses] = useState<PoseLandmark[][]>([]);
  useEffect(() => {
    if (poses.length > 0 || !hasSegmented) return;
    let cancelled = false;
    async function detect() {
      try {
        const { estimatePoses } = await import("@/lib/pose-estimation");
        const src = segmentedFrames.filter(s => s?.length > 0);
        if (src.length === 0) return;
        const results = await estimatePoses(src);
        if (!cancelled) setDetectedPoses(results);
      } catch (e) {
        console.warn("Pose detection failed:", e);
      }
    }
    detect();
    return () => { cancelled = true; };
  }, [segmentedFrames, poses, hasSegmented]);

  const allPoses = poses.length > 0 ? poses : detectedPoses;

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !frames[frameIndex]) return;

    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);

    // Choose which image to show as base
    let imgSrc: string;
    if (viewMode === "segmented" && segmentedFrames[frameIndex]?.length > 0) {
      imgSrc = `data:image/jpeg;base64,${segmentedFrames[frameIndex]}`;
    } else {
      imgSrc = `data:image/jpeg;base64,${frames[frameIndex]}`;
    }

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(cw / img.width, ch / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.drawImage(img, dx, dy, dw, dh);

      // Mask overlay on original view
      if (viewMode === "original" && masks[frameIndex]?.length > 0) {
        const maskImg = new Image();
        maskImg.onload = () => {
          ctx.globalAlpha = 0.3;
          ctx.drawImage(maskImg, dx, dy, dw, dh);
          ctx.globalAlpha = 1.0;
          maybeDrawSkeleton();
          drawAnnotations();
        };
        maskImg.src = `data:image/png;base64,${masks[frameIndex]}`;
        return;
      }

      maybeDrawSkeleton();
      drawAnnotations();

      function maybeDrawSkeleton() {
        if (viewMode === "skeleton" || viewMode === "segmented") {
          const currentPose = allPoses[frameIndex];
          if (currentPose?.some(lm => (lm?.visibility ?? 0) > 0.3)) {
            drawSkeletonOnCtx(ctx, currentPose, dx, dy, dw, dh);
          }
        }
      }

      function drawAnnotations() {
        const frameIssues = issues.filter(i => i.frame_index === frameIndex);
        if (frameIssues.length > 0) {
          let annotY = ch - 10;
          for (const issue of [...frameIssues].reverse()) {
            const text = `${issue.part}: ${issue.description}`;
            ctx.font = "12px system-ui";
            const tw = Math.min(ctx.measureText(text).width + 16, cw - 16);
            ctx.fillStyle = "rgba(0,0,0,0.75)";
            ctx.beginPath();
            ctx.roundRect(8, annotY - 22, tw, 24, 4);
            ctx.fill();
            ctx.fillStyle = "#f59e0b";
            ctx.fillText(text, 16, annotY - 6, cw - 32);
            annotY -= 28;
          }
        }

        if (highlightPart && highlightedIssue) {
          ctx.fillStyle = "rgba(245,158,11,0.9)";
          ctx.beginPath();
          ctx.roundRect(8, 8, 160, 24, 4);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 11px system-ui";
          ctx.fillText(`Showing: ${highlightPart}`, 14, 24);
        }

        // View mode label
        const label = viewMode === "original" ? "Original" : viewMode === "segmented" ? "Segmented + Skeleton" : "Skeleton";
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.roundRect(cw - 130, 8, 122, 22, 4);
        ctx.fill();
        ctx.fillStyle = "#aaa";
        ctx.font = "11px system-ui";
        ctx.fillText(label, cw - 122, 23);
      }
    };
    img.src = imgSrc;
  }, [frameIndex, frames, masks, segmentedFrames, allPoses, viewMode, issues, highlightPart, highlightedIssue]);

  useEffect(() => { drawFrame(); }, [drawFrame]);
  useEffect(() => {
    const observer = new ResizeObserver(() => drawFrame());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [drawFrame]);

  // Auto-play
  useEffect(() => {
    if (isPlaying && totalFrames > 1) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % totalFrames);
      }, 600);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, totalFrames]);

  if (!totalFrames) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
        No frames available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {/* View mode tabs */}
        <div className="flex gap-1">
          {(["original", ...(hasSegmented || hasMasks ? ["segmented"] : []), ...(hasPoses ? ["skeleton"] : [])] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                viewMode === mode
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
              }`}
            >
              {mode === "original" ? "Original" : mode === "segmented" ? "SAM 2 + Skeleton" : "Skeleton Only"}
            </button>
          ))}
        </div>

        {/* Playback controls */}
        {totalFrames > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-xs px-2.5 py-1 rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <span className="text-xs text-[var(--muted-foreground)] w-12">
              {frameIndex + 1}/{totalFrames}
            </span>
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={frameIndex}
              onChange={(e) => {
                setFrameIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="flex-1 accent-[var(--primary)]"
            />
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)]">
          Click an issue to jump to frame
        </p>
      </div>
    </div>
  );
}
