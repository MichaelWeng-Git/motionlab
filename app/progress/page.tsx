"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import ProgressChart from "@/components/progress-chart";
import RadarChart from "@/components/radar-chart";
import { getUserAnalyses, type Analysis } from "@/lib/supabase";
import { STROKE_LABELS } from "@/lib/utils";

export default function ProgressPage() {
  const { user } = useUser();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [strokeFilter, setStrokeFilter] = useState<string>("all");

  useEffect(() => {
    if (!user?.id) return;
    getUserAnalyses(user.id)
      .then(setAnalyses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered =
    strokeFilter === "all"
      ? analyses
      : analyses.filter((a) => a.stroke_type === strokeFilter);

  const latest = filtered[0];
  const previous = filtered[1];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">进步曲线</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "全部" },
          ...Object.entries(STROKE_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStrokeFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              strokeFilter === s.value
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--muted-foreground)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center text-[var(--muted-foreground)]">
          <p>暂无分析记录</p>
          <Link href="/analyze" className="text-[var(--primary)] mt-2 inline-block">
            开始第一次分析 →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score trend */}
          <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h2 className="font-semibold mb-4">评分趋势</h2>
            <ProgressChart analyses={filtered} />
          </div>

          {/* Radar comparison */}
          {latest && (
            <div className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <h2 className="font-semibold mb-4">
                维度对比
                {previous && (
                  <span className="text-sm text-[var(--muted-foreground)] font-normal ml-2">
                    (最新 vs 上次)
                  </span>
                )}
              </h2>
              <RadarChart
                current={latest.dimension_scores}
                previous={previous?.dimension_scores}
              />
            </div>
          )}

          {/* History list */}
          <div className="rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">分析历史</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  href={`/analysis/${a.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {STROKE_LABELS[a.stroke_type]}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-3">
                      {new Date(a.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${
                      a.overall_score >= 80
                        ? "text-green-400"
                        : a.overall_score >= 60
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {a.overall_score}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
