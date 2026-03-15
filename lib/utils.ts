import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STROKE_LABELS: Record<string, string> = {
  freestyle: "自由泳",
  breaststroke: "蛙泳",
  butterfly: "蝶泳",
  backstroke: "仰泳",
};

export const DIMENSION_LABELS: Record<string, string> = {
  entry_angle: "入水角度",
  stroke_power: "划水力量",
  body_rotation: "身体旋转",
  kick_rhythm: "踢腿节奏",
  breathing: "呼吸时机",
  coordination: "整体协调",
};
