"use client";

import { DIMENSION_LABELS } from "@/lib/utils";

type Props = {
  overallScore: number;
  dimensionScores: Record<string, number>;
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function CircularProgress({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-xs text-[var(--muted-foreground)]">Overall</span>
      </div>
    </div>
  );
}

export default function ScoreCard({ overallScore, dimensionScores }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <CircularProgress score={overallScore} />
      </div>

      <div className="space-y-3">
        {Object.entries(dimensionScores).map(([key, score]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span>{DIMENSION_LABELS[key] || key}</span>
              <span className={getScoreColor(score)}>{score}</span>
            </div>
            <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${score}%`,
                  backgroundColor:
                    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
