import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const STROKE_NAMES: Record<string, string> = {
  freestyle: "自由泳 (Freestyle)",
  breaststroke: "蛙泳 (Breaststroke)",
  butterfly: "蝶泳 (Butterfly)",
  backstroke: "仰泳 (Backstroke)",
};

const DIMENSIONS = [
  { key: "entry_angle", name: "入水角度与手部姿态" },
  { key: "stroke_power", name: "划水轨迹与力量" },
  { key: "body_rotation", name: "身体旋转与流线型" },
  { key: "kick_rhythm", name: "踢腿节奏与幅度" },
  { key: "breathing", name: "呼吸时机与头部位置" },
  { key: "coordination", name: "整体协调性" },
];

export async function analyzeSwimming(
  strokeType: string,
  frameImages: string[], // base64 encoded images
  poseData: Array<Array<{ x: number; y: number; z: number; visibility: number }>>
) {
  const strokeName = STROKE_NAMES[strokeType] || strokeType;

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `你是一位专业的游泳教练和运动分析专家。请分析以下${strokeName}的游泳视频帧。
这些帧按时间顺序排列，展示了游泳动作的关键阶段。

我同时提供了每帧的人体骨骼关键点数据（33个MediaPipe关键点的x,y,z坐标），供你参考分析。

请从以下维度评估并给出 0-100 的评分：
${DIMENSIONS.map((d, i) => `${i + 1}. ${d.name} (${d.key})`).join("\n")}

同时识别具体问题并给出改进建议。对于每个问题，请标注涉及的身体部位（使用以下部位名称之一：head, neck, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle, torso）。

请严格以以下JSON格式返回（不要包含其他文字）：
{
  "overall_score": <0-100的整数>,
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
      "part": "<身体部位>",
      "description": "<问题描述>",
      "suggestion": "<改进建议>"
    }
  ]
}

骨骼关键点数据（每帧33个点）：
${JSON.stringify(poseData.map((frame, i) => ({ frame: i + 1, landmarks: frame.slice(0, 10) })))}
（仅展示前10个关键点作为参考，完整数据用于你的分析判断）`,
    },
    ...frameImages.map(
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
    max_tokens: 2000,
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content || "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as {
    overall_score: number;
    dimension_scores: Record<string, number>;
    issues: Array<{ part: string; description: string; suggestion: string }>;
  };
}
