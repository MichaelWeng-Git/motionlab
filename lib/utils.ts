import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STROKE_LABELS: Record<string, string> = {
  freestyle: "Freestyle",
  breaststroke: "Breaststroke",
  butterfly: "Butterfly",
  backstroke: "Backstroke",
};

export const DIMENSION_LABELS: Record<string, string> = {
  entry_angle: "Entry Angle",
  stroke_power: "Stroke Power",
  body_rotation: "Body Rotation",
  kick_rhythm: "Kick Rhythm",
  breathing: "Breathing",
  coordination: "Coordination",
};
