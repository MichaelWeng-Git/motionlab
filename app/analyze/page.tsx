"use client";

import { useRouter } from "next/navigation";
import VideoUploader from "@/components/video-uploader";

export default function AnalyzePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">上传视频分析</h1>
      <p className="text-[var(--muted-foreground)] mb-6">
        上传你的游泳视频，AI 将分析你的动作并给出专业建议
      </p>

      <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <VideoUploader
          onAnalysisComplete={(id) => router.push(`/analysis/${id}`)}
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[var(--muted)] text-sm text-[var(--muted-foreground)] space-y-1">
        <p className="font-medium text-[var(--foreground)]">提示：</p>
        <p>· 建议上传 5-30 秒的短视频，包含完整的划水周期</p>
        <p>· 侧面或水下视角效果最佳</p>
        <p>· 视频清晰度越高，分析结果越准确</p>
      </div>
    </div>
  );
}
