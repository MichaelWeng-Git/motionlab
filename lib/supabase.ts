import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

export type Analysis = {
  id: string;
  user_id: string;
  stroke_type: "freestyle" | "breaststroke" | "butterfly" | "backstroke";
  overall_score: number;
  dimension_scores: Record<string, number>;
  issues: Array<{
    part: string;
    description: string;
    suggestion: string;
  }>;
  keyframe_poses: Array<Array<{ x: number; y: number; z: number; visibility: number }>>;
  thumbnail_base64: string | null;
  created_at: string;
};

export async function saveAnalysis(data: Omit<Analysis, "id" | "created_at">) {
  const { data: result, error } = await getSupabase()
    .from("analyses")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Analysis;
}

export async function getAnalysis(id: string) {
  const { data, error } = await getSupabase()
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Analysis;
}

export async function getUserAnalyses(userId: string, strokeType?: string) {
  let query = getSupabase()
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (strokeType) {
    query = query.eq("stroke_type", strokeType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Analysis[];
}
