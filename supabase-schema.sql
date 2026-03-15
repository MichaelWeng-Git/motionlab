-- Run this in your Supabase SQL editor to create the required table

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  stroke_type text not null check (stroke_type in ('freestyle', 'breaststroke', 'butterfly', 'backstroke')),
  overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
  dimension_scores jsonb not null default '{}',
  issues jsonb not null default '[]',
  keyframe_poses jsonb not null default '[]',
  thumbnail_base64 text,
  created_at timestamp with time zone default now()
);

-- Index for fast user queries
create index if not exists idx_analyses_user_id on analyses(user_id);
create index if not exists idx_analyses_user_stroke on analyses(user_id, stroke_type);

-- Enable RLS
alter table analyses enable row level security;

-- Policy: users can only see their own analyses
create policy "Users can view own analyses"
  on analyses for select
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own analyses"
  on analyses for insert
  with check (true);
