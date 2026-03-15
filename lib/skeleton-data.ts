// MediaPipe Pose 33 landmarks connections for skeleton rendering
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker

export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

// Landmark index to body part name mapping (for issue highlighting)
export const LANDMARK_TO_PART: Record<number, string> = {
  0: "head", 1: "head", 2: "head", 3: "head", 4: "head",
  5: "head", 6: "head", 7: "head", 8: "head", 9: "head", 10: "head",
  11: "left_shoulder", 12: "right_shoulder",
  13: "left_elbow", 14: "right_elbow",
  15: "left_wrist", 16: "right_wrist",
  17: "left_wrist", 18: "right_wrist",
  19: "left_wrist", 20: "right_wrist",
  21: "left_wrist", 22: "right_wrist",
  23: "left_hip", 24: "right_hip",
  25: "left_knee", 26: "right_knee",
  27: "left_ankle", 28: "right_ankle",
  29: "left_ankle", 30: "right_ankle",
  31: "left_ankle", 32: "right_ankle",
};

export const PART_TO_LANDMARKS: Record<string, number[]> = {};
for (const [idx, part] of Object.entries(LANDMARK_TO_PART)) {
  if (!PART_TO_LANDMARKS[part]) PART_TO_LANDMARKS[part] = [];
  PART_TO_LANDMARKS[part].push(Number(idx));
}
// Add compound parts
PART_TO_LANDMARKS["neck"] = [11, 12, 0];
PART_TO_LANDMARKS["torso"] = [11, 12, 23, 24];
PART_TO_LANDMARKS["left_arm"] = [11, 13, 15];
PART_TO_LANDMARKS["right_arm"] = [12, 14, 16];

// Ideal freestyle pose landmarks (normalized, one key frame)
// This is a simplified ideal pose for demonstration
export const IDEAL_POSES: Record<string, Array<{ x: number; y: number; z: number }>> = {
  freestyle: Array.from({ length: 33 }, (_, i) => {
    // Simplified ideal freestyle glide position
    const base = [
      { x: 0.5, y: 0.15, z: 0 },   // nose
      { x: 0.49, y: 0.14, z: -0.01 }, // left eye inner
      { x: 0.48, y: 0.13, z: -0.01 }, // left eye
      { x: 0.47, y: 0.14, z: -0.01 }, // left eye outer
      { x: 0.51, y: 0.14, z: -0.01 }, // right eye inner
      { x: 0.52, y: 0.13, z: -0.01 }, // right eye
      { x: 0.53, y: 0.14, z: -0.01 }, // right eye outer
      { x: 0.46, y: 0.15, z: -0.02 }, // left ear
      { x: 0.54, y: 0.15, z: -0.02 }, // right ear
      { x: 0.49, y: 0.17, z: 0 },   // mouth left
      { x: 0.51, y: 0.17, z: 0 },   // mouth right
      { x: 0.4, y: 0.25, z: 0 },    // left shoulder
      { x: 0.6, y: 0.25, z: 0 },    // right shoulder
      { x: 0.35, y: 0.35, z: 0 },   // left elbow
      { x: 0.65, y: 0.35, z: 0 },   // right elbow
      { x: 0.3, y: 0.15, z: 0 },    // left wrist (extended forward)
      { x: 0.7, y: 0.45, z: 0 },    // right wrist
      { x: 0.28, y: 0.14, z: 0 },   // left pinky
      { x: 0.72, y: 0.46, z: 0 },   // right pinky
      { x: 0.29, y: 0.13, z: 0 },   // left index
      { x: 0.71, y: 0.44, z: 0 },   // right index
      { x: 0.3, y: 0.14, z: 0 },    // left thumb
      { x: 0.7, y: 0.44, z: 0 },    // right thumb
      { x: 0.42, y: 0.55, z: 0 },   // left hip
      { x: 0.58, y: 0.55, z: 0 },   // right hip
      { x: 0.43, y: 0.7, z: 0 },    // left knee
      { x: 0.57, y: 0.7, z: 0 },    // right knee
      { x: 0.44, y: 0.85, z: 0 },   // left ankle
      { x: 0.56, y: 0.85, z: 0 },   // right ankle
      { x: 0.44, y: 0.88, z: 0 },   // left heel
      { x: 0.56, y: 0.88, z: 0 },   // right heel
      { x: 0.43, y: 0.9, z: 0 },    // left foot index
      { x: 0.57, y: 0.9, z: 0 },    // right foot index
    ];
    return base[i] || { x: 0.5, y: 0.5, z: 0 };
  }),
};
