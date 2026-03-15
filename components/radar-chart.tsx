"use client";

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DIMENSION_LABELS } from "@/lib/utils";

type Props = {
  current: Record<string, number>;
  previous?: Record<string, number>;
};

export default function RadarChart({ current, previous }: Props) {
  const data = Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
    dimension: label,
    current: current[key] || 0,
    ...(previous ? { previous: previous[key] || 0 } : {}),
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="dimension"
            stroke="var(--muted-foreground)"
            fontSize={11}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            stroke="var(--border)"
            fontSize={10}
          />
          <Radar
            name="当前"
            dataKey="current"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.2}
          />
          {previous && (
            <Radar
              name="上次"
              dataKey="previous"
              stroke="var(--muted-foreground)"
              fill="var(--muted-foreground)"
              fillOpacity={0.1}
            />
          )}
          <Legend />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
