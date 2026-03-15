"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Film, Loader2 } from "lucide-react";

type Props = {
  onAnalysisComplete: (analysisId: string) => void;
};

type Stage = "idle" | "extracting" | "pose" | "analyzing" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Waiting for upload",
  extracting: "Extracting key frames...",
  pose: "Detecting skeleton keypoints...",
  analyzing: "AI is analyzing your form...",
  done: "Analysis complete!",
  error: "Analysis failed",
};

export default function VideoUploader({ onAnalysisComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [strokeType, setStrokeType] = useState("freestyle");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("video/")) {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a video file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      setStage("extracting");
      setProgress(0);

      const { extractFrames } = await import("@/lib/frame-extractor");
      const frames = await extractFrames(file, 8, (p) => setProgress(p * 33));

      if (frames.length === 0) {
        throw new Error("Could not extract frames from video");
      }

      setStage("pose");
      const { estimatePoses } = await import("@/lib/pose-estimation");
      const poses = await estimatePoses(frames, (current, total) => {
        setProgress(33 + (current / total) * 33);
      });

      setStage("analyzing");
      setProgress(70);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strokeType,
          frames,
          poses,
          thumbnailBase64: frames[0] || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const { analysis } = await response.json();
      setProgress(100);
      setStage("done");
      onAnalysisComplete(analysis.id);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Error during analysis");
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          file
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <Film className="w-10 h-10 text-[var(--accent)]" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">
              Drag & drop a video here, or click to select
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Supports MP4, MOV, AVI and more
            </p>
          </div>
        )}
      </div>

      {/* Stroke type selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Stroke</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "freestyle", label: "Freestyle" },
            { value: "breaststroke", label: "Breaststroke" },
            { value: "butterfly", label: "Butterfly" },
            { value: "backstroke", label: "Backstroke" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setStrokeType(s.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                strokeType === s.value
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--muted-foreground)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {stage !== "idle" && stage !== "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {stage !== "done" && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{STAGE_LABELS[stage]}</span>
          </div>
          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 text-[var(--destructive)] text-sm">
          {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || (stage !== "idle" && stage !== "error")}
        className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {stage === "idle" || stage === "error" ? "Start Analysis" : "Analyzing..."}
      </button>
    </div>
  );
}
