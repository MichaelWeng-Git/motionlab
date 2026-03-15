"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SkeletonViewer from "@/components/skeleton-viewer";
import ScoreCard from "@/components/score-card";
import RadarChart from "@/components/radar-chart";
import { getAnalysis, type Analysis } from "@/lib/supabase";
import { STROKE_LABELS } from "@/lib/utils";

export default function AnalysisPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightPart, setHighlightPart] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAnalysis(params.id as string);
        setAnalysis(data);
      } catch (err) {
        setError("无法加载分析结果");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--destructive)]">{error || "分析结果不存在"}</p>
        <Link href="/dashboard" className="text-[var(--primary)] mt-4 inline-block">
          返回 Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {STROKE_LABELS[analysis.stroke_type] || analysis.stroke_type} 分析结果
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {new Date(analysis.created_at).toLocaleString("zh-CN")}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: 3D Skeleton Viewer */}
        <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden h-[500px]">
          <SkeletonViewer
            poses={analysis.keyframe_poses}
            issues={analysis.issues}
            strokeType={analysis.stroke_type}
            highlightPart={highlightPart}
          />
        </div>

        {/* Right: Analysis Report */}
        <div className="space-y-6">
          {/* Score */}
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <ScoreCard
              overallScore={analysis.overall_score}
              dimensionScores={analysis.dimension_scores}
            />
          </div>

          {/* Radar chart */}
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="font-semibold mb-3">维度分析</h3>
            <RadarChart current={analysis.dimension_scores} />
          </div>

          {/* Issues */}
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="font-semibold mb-3">
              问题与建议 ({analysis.issues.length})
            </h3>
            <div className="space-y-3">
              {analysis.issues.map((issue, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setHighlightPart(
                      highlightPart === issue.part ? null : issue.part
                    )
                  }
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    highlightPart === issue.part
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                      {issue.part}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{issue.description}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    💡 {issue.suggestion}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
