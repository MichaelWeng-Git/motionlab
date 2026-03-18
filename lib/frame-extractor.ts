"use client";

export async function extractFrames(
  videoFile: File,
  numFrames: number = 12,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  onProgress?.(0.1);

  // Create a video element to extract frames using canvas
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;

  const url = URL.createObjectURL(videoFile);
  video.src = url;

  // Wait for metadata to load (gives us duration)
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const duration = video.duration;
  if (!duration || duration === Infinity) {
    throw new Error("Could not determine video duration");
  }

  onProgress?.(0.2);

  // Calculate timestamps to extract frames evenly across the video
  const timestamps: number[] = [];
  for (let i = 0; i < numFrames; i++) {
    timestamps.push((i / (numFrames - 1)) * duration);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const frames: string[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    // Seek to timestamp
    video.currentTime = timestamps[i];
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    // Set canvas size (scale down to max 640px wide)
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    // Draw frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 JPEG
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const base64 = dataUrl.split(",")[1];
    frames.push(base64);

    onProgress?.(0.2 + (i / timestamps.length) * 0.8);
  }

  // Cleanup
  URL.revokeObjectURL(url);
  onProgress?.(1);

  return frames;
}
