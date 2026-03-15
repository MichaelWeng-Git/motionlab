"use client";

import { useRouter } from "next/navigation";
import VideoUploader from "@/components/video-uploader";

export default function AnalyzePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Upload & Analyze</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        Upload your swimming video and AI will analyze your form with professional feedback
      </p>

      <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <VideoUploader
          onAnalysisComplete={(id) => router.push(`/analysis/${id}`)}
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[var(--muted)] text-sm text-[var(--muted-foreground)] space-y-1">
        <p className="font-medium text-[var(--foreground)]">Tips:</p>
        <p>· Upload a 5-30 second clip covering a full stroke cycle</p>
        <p>· Side view or underwater angles work best</p>
        <p>· Higher video clarity means more accurate analysis</p>
      </div>
    </div>
  );
}
