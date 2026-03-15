"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

export async function extractFrames(
  videoFile: File,
  numFrames: number = 8,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const ff = await getFFmpeg();

  onProgress?.(0.1);

  // Write video file to FFmpeg virtual filesystem
  await ff.writeFile("input.mp4", await fetchFile(videoFile));

  onProgress?.(0.3);

  // Get video duration using ffprobe-like approach
  // Extract frames evenly distributed across the video
  // Use fps filter to extract approximately numFrames
  await ff.exec([
    "-i", "input.mp4",
    "-vf", `select='not(mod(n\\,${Math.max(1, Math.floor(30 / numFrames))}*3))',setpts=N/FRAME_RATE/TB,scale=640:-2`,
    "-frames:v", String(numFrames),
    "-q:v", "5",
    "frame_%03d.jpg",
  ]);

  onProgress?.(0.7);

  // Read extracted frames
  const frames: string[] = [];
  for (let i = 1; i <= numFrames; i++) {
    const fileName = `frame_${String(i).padStart(3, "0")}.jpg`;
    try {
      const data = await ff.readFile(fileName);
      if (data instanceof Uint8Array) {
        const base64 = uint8ArrayToBase64(data);
        frames.push(base64);
      }
    } catch {
      // No more frames available
      break;
    }
  }

  onProgress?.(0.9);

  // Cleanup
  try {
    await ff.deleteFile("input.mp4");
    for (let i = 1; i <= numFrames; i++) {
      const fileName = `frame_${String(i).padStart(3, "0")}.jpg`;
      try { await ff.deleteFile(fileName); } catch { /* ignore */ }
    }
  } catch { /* ignore cleanup errors */ }

  onProgress?.(1);

  return frames;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
