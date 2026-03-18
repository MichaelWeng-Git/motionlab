"use client";

import { useRef, useState } from "react";

type Props = {
  frameBase64: string;
  onSelect: (point: { x: number; y: number }) => void;
  onSkip: () => void;
};

export default function PersonSelector({ frameBase64, onSelect, onSkip }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setClickPos({ x, y });
  };

  const handleConfirm = () => {
    if (clickPos) onSelect(clickPos);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">Click on yourself in the video</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          This helps AI isolate and track you throughout the video
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-[var(--border)] cursor-crosshair">
        <img
          ref={imgRef}
          src={`data:image/jpeg;base64,${frameBase64}`}
          alt="First frame"
          onClick={handleClick}
          className="w-full"
          draggable={false}
        />
        {clickPos && (
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-3 border-[var(--accent)] bg-[var(--accent)]/30 pointer-events-none"
            style={{
              left: `${clickPos.x * 100}%`,
              top: `${clickPos.y * 100}%`,
              borderWidth: "3px",
            }}
          >
            <div className="absolute inset-1 rounded-full bg-[var(--accent)]" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!clickPos}
          className="flex-1 py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {clickPos ? "Confirm & Analyze" : "Click on yourself first"}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)] text-sm hover:opacity-90 transition-opacity"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
