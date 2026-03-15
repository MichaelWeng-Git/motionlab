"use client";

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { POSE_CONNECTIONS, PART_TO_LANDMARKS, IDEAL_POSES } from "@/lib/skeleton-data";

type PoseLandmark = { x: number; y: number; z: number; visibility?: number };

type Props = {
  poses: PoseLandmark[][];
  issues?: Array<{ part: string; description: string; suggestion: string }>;
  strokeType?: string;
  highlightPart?: string | null;
};

function landmarkToVec3(lm: PoseLandmark): [number, number, number] {
  return [(lm.x - 0.5) * 4, -(lm.y - 0.5) * 4, (lm.z || 0) * 2];
}

function getPartColor(
  landmarkIdx: number,
  issueParts: Set<string>,
  highlightPart: string | null
): string {
  const part = Object.entries(PART_TO_LANDMARKS).find(([, indices]) =>
    indices.includes(landmarkIdx)
  )?.[0];

  if (highlightPart && part === highlightPart) return "#f59e0b";
  if (part && issueParts.has(part)) return "#ef4444";
  return "#22c55e";
}

function SkeletonBody({
  landmarks,
  issueParts,
  highlightPart,
  color,
  opacity = 1,
}: {
  landmarks: PoseLandmark[];
  issueParts: Set<string>;
  highlightPart: string | null;
  color?: string;
  opacity?: number;
}) {
  const positions = useMemo(
    () => landmarks.map(landmarkToVec3),
    [landmarks]
  );

  return (
    <group>
      {positions.map((pos, i) => {
        const visibility = landmarks[i]?.visibility ?? 1;
        if (visibility < 0.3) return null;
        const jointColor = color || getPartColor(i, issueParts, highlightPart);
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={jointColor}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {POSE_CONNECTIONS.map(([a, b], i) => {
        const va = landmarks[a]?.visibility ?? 1;
        const vb = landmarks[b]?.visibility ?? 1;
        if (va < 0.3 || vb < 0.3) return null;

        const lineColor = color || getPartColor(a, issueParts, highlightPart);
        return (
          <Line
            key={i}
            points={[positions[a], positions[b]]}
            color={lineColor}
            lineWidth={2}
            transparent={opacity < 1}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

function Scene({
  landmarks,
  issueParts,
  highlightPart,
  showIdeal,
  strokeType,
}: {
  landmarks: PoseLandmark[];
  issueParts: Set<string>;
  highlightPart: string | null;
  showIdeal: boolean;
  strokeType: string;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <OrbitControls enableDamping dampingFactor={0.1} />

      <SkeletonBody
        landmarks={landmarks}
        issueParts={issueParts}
        highlightPart={highlightPart}
      />

      {showIdeal && IDEAL_POSES[strokeType] && (
        <SkeletonBody
          landmarks={IDEAL_POSES[strokeType].map((p) => ({ ...p, visibility: 1 }))}
          issueParts={new Set()}
          highlightPart={null}
          color="#3b82f6"
          opacity={0.3}
        />
      )}

      <gridHelper args={[8, 20, "#333", "#222"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1]} />
    </>
  );
}

export default function SkeletonViewer({ poses, issues = [], strokeType = "freestyle", highlightPart = null }: Props) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [showIdeal, setShowIdeal] = useState(false);

  const issueParts = useMemo(
    () => new Set(issues.map((i) => i.part)),
    [issues]
  );

  const currentLandmarks = poses[frameIndex] || poses[0] || [];

  if (!poses.length || !currentLandmarks.length) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
        No skeleton data
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene
            landmarks={currentLandmarks}
            issueParts={issueParts}
            highlightPart={highlightPart}
            showIdeal={showIdeal}
            strokeType={strokeType}
          />
        </Canvas>
      </div>

      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {poses.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted-foreground)] w-16">
              Frame {frameIndex + 1}/{poses.length}
            </span>
            <input
              type="range"
              min={0}
              max={poses.length - 1}
              value={frameIndex}
              onChange={(e) => setFrameIndex(Number(e.target.value))}
              className="flex-1 accent-[var(--primary)]"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showIdeal}
            onChange={(e) => setShowIdeal(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          <span className="text-[var(--muted-foreground)]">
            Show ideal pose (blue, semi-transparent)
          </span>
        </label>

        <div className="flex gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Good
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Needs work
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Selected
          </span>
        </div>
      </div>
    </div>
  );
}
