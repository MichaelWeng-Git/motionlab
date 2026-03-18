"use client";

import { useState } from "react";
import { PRO_SWIMMERS, type ProSwimmer } from "@/lib/pro-swimmers";

type Props = {
  strokeType: string;
};

export default function ProComparison({ strokeType }: Props) {
  const swimmers = PRO_SWIMMERS[strokeType] || PRO_SWIMMERS["freestyle"];
  const [selected, setSelected] = useState<ProSwimmer | null>(null);

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium">
          Compare with Pro Swimmers
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          Select a world-class swimmer to study their technique
        </p>
      </div>

      {/* Swimmer selection */}
      {!selected ? (
        <div className="p-3 space-y-2">
          {swimmers.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--muted-foreground)] transition-colors text-left"
            >
              <img
                src={s.thumbnail}
                alt={s.name}
                className="w-20 h-12 rounded object-cover bg-[var(--muted)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs">{s.flag}</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  {s.achievement}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          {/* Selected swimmer video */}
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${selected.youtubeId}?rel=0`}
              title={selected.name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Info bar */}
          <div className="p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{selected.name}</span>
                <span className="text-xs">{selected.flag}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {selected.achievement}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
