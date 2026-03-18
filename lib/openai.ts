import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Step 1: Detect sport from video frames
export async function detectSport(frameImages: string[]) {
  const sampleFrames = frameImages.filter((_, i) =>
    i === 0 || i === Math.floor(frameImages.length / 2) || i === frameImages.length - 1
  ).slice(0, 3);

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Look at these video frames and identify the sport being performed.

Return ONLY the following JSON:
{
  "sport": "<sport name in lowercase, e.g. swimming, running, basketball, tennis, etc.>",
  "has_multiple_athletes": <true if there are multiple athletes visible, false if only one>,
  "details": "<brief description of what you see, e.g. 'pool with 8 lanes, competition setting'>"
}`,
    },
    ...sampleFrames.map(
      (img) =>
        ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img}`, detail: "low" },
        }) as OpenAI.Chat.Completions.ChatCompletionContentPart
    ),
  ];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content }],
    max_tokens: 200,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";
  return JSON.parse(text) as {
    sport: string;
    has_multiple_athletes: boolean;
    details: string;
  };
}

// Step 2: Full swimming analysis
export async function analyzeSwimming(
  frameImages: string[],
  lane?: number
) {
  const laneInstruction = lane
    ? `\nIMPORTANT: This is a race video with multiple swimmers. The user is in LANE ${lane} (counting from left to right or top to bottom). Focus your analysis ONLY on the swimmer in lane ${lane}. Ignore all other swimmers.`
    : "";

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `You are an elite-level swimming coach with 20+ years of experience coaching Olympic and competitive swimmers. You are analyzing video frames from a swimming session.

The ${frameImages.length} frames below are in chronological order, evenly sampled across the video.${laneInstruction}

Your task:

1. **Identify the stroke** being performed (freestyle, breaststroke, butterfly, or backstroke).

2. **Analyze technique in detail** across these dimensions, giving an honest score (0-100). Be critical — a score of 70 means "competent but has clear issues", 85+ means "excellent technique":
   - **Entry Angle**: Hand entry position, angle of attack, finger-first or flat, extension
   - **Stroke Power**: Catch position, pull pattern (S-pull vs straight), early vertical forearm, push through
   - **Body Rotation**: Hip rotation, shoulder roll, streamline position, body alignment
   - **Kick Rhythm**: Kick tempo relative to stroke, amplitude, knee bend, ankle flexibility
   - **Breathing**: Head rotation (not lift), timing relative to stroke cycle, bilateral vs one-sided
   - **Coordination**: Stroke timing, rhythm consistency, smooth transitions between phases

3. **Identify specific technique issues** you can actually see in the frames. For each issue:
   - Describe exactly what you see wrong
   - Explain why it matters (drag, power loss, injury risk, etc.)
   - Give a specific drill or correction to fix it
   - Tag the body part involved

4. **For each frame**, note what phase of the stroke cycle it captures and any key observations.

Return ONLY this JSON:
{
  "detected_stroke": "freestyle|breaststroke|butterfly|backstroke",
  "overall_score": <0-100>,
  "dimension_scores": {
    "entry_angle": <0-100>,
    "stroke_power": <0-100>,
    "body_rotation": <0-100>,
    "kick_rhythm": <0-100>,
    "breathing": <0-100>,
    "coordination": <0-100>
  },
  "issues": [
    {
      "part": "head|neck|left_shoulder|right_shoulder|left_elbow|right_elbow|left_wrist|right_wrist|left_hip|right_hip|left_knee|right_knee|left_ankle|right_ankle|torso",
      "description": "<what you see wrong>",
      "suggestion": "<specific drill or fix>",
      "frame_index": <which frame (0-indexed) best shows this issue>
    }
  ],
  "frame_notes": [
    "<brief note for each frame, e.g. 'catch phase - good elbow position' or 'recovery - hand crossing midline'>"
  ],
  "summary": "<2-3 sentence overall assessment>"
}`,
    },
    ...frameImages.map(
      (img, i) =>
        ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img}`, detail: "high" },
        }) as OpenAI.Chat.Completions.ChatCompletionContentPart
    ),
  ];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content }],
    max_tokens: 3000,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";
  console.log("GPT-4o raw response:", text.slice(0, 500));

  if (!text.trim()) {
    throw new Error("GPT-4o returned an empty response");
  }

  try {
    return JSON.parse(text) as {
      detected_stroke: string;
      overall_score: number;
      dimension_scores: Record<string, number>;
      issues: Array<{ part: string; description: string; suggestion: string; frame_index?: number }>;
      frame_notes?: string[];
      summary?: string;
    };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response: " + text.slice(0, 200));
    }
    return JSON.parse(jsonMatch[0]);
  }
}
