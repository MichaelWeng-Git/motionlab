"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Analysis } from "@/lib/supabase";

type Props = {
  analyses: Analysis[];
};

export default function ProgressChart({ analyses }: Props) {
  const data = [...analyses]
    .reverse()
    .map((a) => ({
      date: new Date(a.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: a.overall_score,
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)]">
        No analyses yet
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: "var(--primary)", r: 4 }}
            name="Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
