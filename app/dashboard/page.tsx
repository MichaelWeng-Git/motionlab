"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserAnalyses, type Analysis } from "@/lib/supabase";
import { STROKE_LABELS } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useUser();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getUserAnalyses(user.id)
      .then(setAnalyses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const recentAnalyses = analyses.slice(0, 5);
  const strokeStats = ["freestyle", "breaststroke", "butterfly", "backstroke"].map(
    (type) => {
      const typeAnalyses = analyses.filter((a) => a.stroke_type === type);
      const latest = typeAnalyses[0];
      return {
        type,
        label: STROKE_LABELS[type],
        count: typeAnalyses.length,
        latestScore: latest?.overall_score ?? null,
      };
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/analyze"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Analysis
        </Link>
      </div>

      {/* Stroke stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {strokeStats.map((s) => (
          <div
            key={s.type}
            className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
          >
            <div className="text-sm text-[var(--muted-foreground)]">{s.label}</div>
            <div className="text-2xl font-bold mt-1">
              {s.latestScore !== null ? s.latestScore : "—"}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {s.count} {s.count === 1 ? "analysis" : "analyses"}
            </div>
          </div>
        ))}
      </div>

      {/* Recent analyses */}
      <div className="rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Recent Analyses</h2>
        </div>
        {recentAnalyses.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            <p>No analyses yet</p>
            <Link
              href="/analyze"
              className="text-[var(--primary)] mt-2 inline-block"
            >
              Upload your first video →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentAnalyses.map((a) => (
              <Link
                key={a.id}
                href={`/analysis/${a.id}`}
                className="flex items-center justify-between p-4 hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {a.thumbnail_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${a.thumbnail_base64}`}
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[var(--muted)] flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                      🏊
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">
                      {STROKE_LABELS[a.stroke_type]}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    a.overall_score >= 80
                      ? "text-green-400"
                      : a.overall_score >= 60
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {a.overall_score}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
