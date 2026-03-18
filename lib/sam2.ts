/**
 * SAM 2 client - calls the local Python SAM 2 server.
 */

const SAM2_SERVER = process.env.SAM2_SERVER_URL || "http://localhost:8000";

export type FrameSegResult = {
  mask: string;       // base64 PNG mask overlay
  segmented: string;  // base64 JPEG — person only, black bg
  score: number;
};

export type SegmentationResult = {
  results: FrameSegResult[];
};

export async function segmentPerson(
  frames: string[],
  clickPoint: { x: number; y: number }
): Promise<SegmentationResult> {
  const response = await fetch(`${SAM2_SERVER}/segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      frames,
      click_point: clickPoint,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SAM 2 server error: ${text}`);
  }

  return await response.json();
}

export async function checkSAM2Health(): Promise<boolean> {
  try {
    const response = await fetch(`${SAM2_SERVER}/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}
