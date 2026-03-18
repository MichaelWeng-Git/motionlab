"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Film, Loader2, CheckCircle } from "lucide-react";
import PersonSelector from "./person-selector";

type Props = {
  onAnalysisComplete: (analysisId: string) => void;
};

type Step =
  | "upload"
  | "extracting"
  | "detecting"
  | "select-person"
  | "lane-select"
  | "segmenting"
  | "skeleton"
  | "analyzing"
  | "done"
  | "error";

const STEP_LABELS: Record<Step, string> = {
  upload: "Upload a video",
  extracting: "Extracting key frames...",
  detecting: "Detecting sport type...",
  "select-person": "Select yourself in the video",
  "lane-select": "Select your lane",
  segmenting: "SAM 2 is isolating you from the video...",
  skeleton: "Detecting skeleton on segmented image...",
  analyzing: "AI coach is analyzing your technique...",
  done: "Analysis complete!",
  error: "Something went wrong",
};

export default function VideoUploader({ onAnalysisComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detectedSport, setDetectedSport] = useState("");
  const [hasMultipleAthletes, setHasMultipleAthletes] = useState(false);
  const [sportDetails, setSportDetails] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [masks, setMasks] = useState<string[]>([]);
  const [segmentedFrames, setSegmentedFrames] = useState<string[]>([]);
  const [lane, setLane] = useState<number>(0);

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

  const uploadVideoFile = async (): Promise<string | null> => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch("/api/upload-video", { method: "POST", body: formData });
      if (res.ok) {
        const { videoUrl } = await res.json();
        return videoUrl;
      }
    } catch { /* optional */ }
    return null;
  };

  // Step 1: Extract frames + detect sport
  const handleUpload = async () => {
    if (!file) return;
    try {
      setStep("extracting");
      setProgress(0);

      const { extractFrames } = await import("@/lib/frame-extractor");
      const extractedFrames = await extractFrames(file, 12, (p) => setProgress(p * 35));
      setFrames(extractedFrames);

      if (extractedFrames.length === 0) throw new Error("Could not extract frames from video");

      setStep("detecting");
      setProgress(38);

      const response = await fetch("/api/detect-sport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: extractedFrames }),
      });

      if (!response.ok) throw new Error("Sport detection failed");

      const detection = await response.json();
      setDetectedSport(detection.sport);
      setHasMultipleAthletes(detection.has_multiple_athletes);
      setSportDetails(detection.details);
      setProgress(42);

      // Multiple athletes → show person selector for SAM 2
      if (detection.has_multiple_athletes) {
        setStep("select-person");
        return;
      }

      // Single person → skip SAM 2, go to analysis
      await runAnalysis(extractedFrames, [], [], undefined);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Error during upload");
    }
  };

  // Step 2: Person selected → SAM 2 segment → skeleton → analysis
  const handlePersonSelected = async (clickPoint: { x: number; y: number }) => {
    try {
      // SAM 2 segmentation
      setStep("segmenting");
      setProgress(45);

      const segResponse = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, clickPoint }),
      });

      let segMasks: string[] = [];
      let segImages: string[] = [];

      if (segResponse.ok) {
        const segResult = await segResponse.json();
        segMasks = segResult.masks || [];
        segImages = segResult.segmentedFrames || [];
        setMasks(segMasks);
        setSegmentedFrames(segImages);
      }

      setProgress(60);

      // Skeleton detection on segmented images (clean bg = better accuracy)
      let poses: Array<Array<{ x: number; y: number; z: number; visibility: number }>> = [];
      if (segImages.length > 0) {
        setStep("skeleton");
        setProgress(62);
        try {
          const { estimatePoses } = await import("@/lib/pose-estimation");
          poses = await estimatePoses(segImages, (current, total) => {
            setProgress(62 + (current / total) * 10);
          });
        } catch (e) {
          console.warn("Pose detection failed, continuing:", e);
        }
      }

      setProgress(73);

      // Ask lane if swimming
      if (detectedSport === "swimming" && hasMultipleAthletes) {
        // Store poses temporarily, will use in runAnalysis
        (window as any).__motionlab_poses = poses;
        setStep("lane-select");
        return;
      }

      await runAnalysis(frames, segMasks, poses, undefined);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Error during segmentation");
    }
  };

  const handleSkipSelection = async () => {
    if (detectedSport === "swimming" && hasMultipleAthletes) {
      setStep("lane-select");
      return;
    }
    await runAnalysis(frames, [], [], undefined);
  };

  // Step 3: Full analysis
  const runAnalysis = async (
    framesToUse: string[],
    maskData: string[],
    poseData: Array<Array<{ x: number; y: number; z: number; visibility: number }>>,
    selectedLane?: number,
  ) => {
    try {
      setStep("analyzing");
      setProgress(75);

      const videoUploadPromise = uploadVideoFile();

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 92));
      }, 1000);

      const videoUrl = await videoUploadPromise;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: framesToUse,
          masks: maskData.length > 0 ? maskData : undefined,
          segmentedFrames: segmentedFrames.length > 0 ? segmentedFrames : undefined,
          poses: poseData.length > 0 ? poseData : undefined,
          lane: selectedLane || undefined,
          videoUrl: videoUrl || undefined,
          thumbnailBase64: framesToUse[0] || null,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const { analysis } = await response.json();
      setProgress(100);
      setStep("done");
      onAnalysisComplete(analysis.id);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Error during analysis");
    }
  };

  const handleLaneConfirm = () => {
    const poses = (window as any).__motionlab_poses || [];
    delete (window as any).__motionlab_poses;
    runAnalysis(frames, masks, poses, lane || undefined);
  };

  const handleReset = () => {
    setFile(null);
    setStep("upload");
    setProgress(0);
    setError("");
    setFrames([]);
    setMasks([]);
    setSegmentedFrames([]);
    setDetectedSport("");
    setHasMultipleAthletes(false);
    setSportDetails("");
    setLane(0);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => step === "upload" && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          step === "upload" ? "cursor-pointer" : "cursor-default"
        } ${
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

      {/* Sport detection result */}
      {detectedSport && step !== "upload" && (
        <div className="p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
            <span>Detected: <strong className="capitalize">{detectedSport}</strong></span>
          </div>
          {sportDetails && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-6">{sportDetails}</p>
          )}
        </div>
      )}

      {/* Person selector */}
      {step === "select-person" && frames[0] && (
        <PersonSelector
          frameBase64={frames[0]}
          onSelect={handlePersonSelected}
          onSkip={handleSkipSelection}
        />
      )}

      {/* Lane selector */}
      {step === "lane-select" && (
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div>
            <h3 className="font-medium">Which lane are you in?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              This helps AI focus its analysis on the correct swimmer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setLane(n)}
                className={`w-11 h-11 rounded-lg text-sm font-medium transition-colors ${
                  lane === n
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] border border-[var(--border)] hover:border-[var(--muted-foreground)]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handleLaneConfirm}
            disabled={lane === 0}
            className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {lane > 0 ? `Analyze Lane ${lane}` : "Select a lane"}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {!["upload", "select-person", "lane-select", "error"].includes(step) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {step !== "done" && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === "done" && <CheckCircle className="w-4 h-4 text-green-400" />}
            <span>{STEP_LABELS[step]}</span>
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

      {/* Action button */}
      {step === "upload" && (
        <button
          onClick={handleUpload}
          disabled={!file}
          className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Start Analysis
        </button>
      )}
      {step === "error" && (
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-lg bg-[var(--muted)] text-[var(--foreground)] font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
