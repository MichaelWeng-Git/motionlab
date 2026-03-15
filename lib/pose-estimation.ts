"use client";

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;

async function getPoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
  });

  return poseLandmarker;
}

export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export async function estimatePose(
  imageBase64: string,
  onProgress?: (frameIndex: number, total: number) => void
): Promise<PoseLandmark[]> {
  const landmarker = await getPoseLandmarker();

  // Create image element from base64
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = `data:image/jpeg;base64,${imageBase64}`;
  });

  const result = landmarker.detect(img);

  if (!result.landmarks || result.landmarks.length === 0) {
    // Return empty landmarks if no pose detected
    return Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
  }

  return result.landmarks[0].map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility ?? 0,
  }));
}

export async function estimatePoses(
  framesBase64: string[],
  onProgress?: (current: number, total: number) => void
): Promise<PoseLandmark[][]> {
  const results: PoseLandmark[][] = [];

  for (let i = 0; i < framesBase64.length; i++) {
    const landmarks = await estimatePose(framesBase64[i]);
    results.push(landmarks);
    onProgress?.(i + 1, framesBase64.length);
  }

  return results;
}
