# MotionLab

> AI swimming coach: upload a video of your stroke and get a 0–100 score, six technique dimensions, a skeleton overlay and concrete drills for what to fix.

**Live:** [motionlab-five.vercel.app](https://motionlab-five.vercel.app)

---

## What makes it different

The video is **sampled in the browser, not on a server**. Twelve evenly spaced
frames are pulled from the clip with a `<video>` element and a canvas, scaled
to at most 640 px wide, and only those JPEG frames go to the model. That keeps
the serverless routes small and means a five-minute race video costs the same
to analyse as a ten-second one.

And it is built for **real pool footage, where you are rarely the only swimmer
in frame**. A first GPT-4o pass detects the sport and whether several athletes
are visible. If they are, you click on yourself, an optional SAM 2 server cuts
you out of every frame, MediaPipe runs on the clean silhouette, and you pick
your lane so the coach grades only you. With one swimmer, all of that is
skipped.

## Features

| Feature | Description |
|---------|-------------|
| Stroke analysis | GPT-4o, prompted as an elite coach, detects the stroke and scores it 0–100 |
| Six dimensions | Entry angle, stroke power, body rotation, kick rhythm, breathing, coordination |
| Issues and drills | Each issue is tagged with a body part and the frame that shows it best, plus a specific correction |
| Frame notes | A per-frame note on which phase of the stroke cycle it captures |
| Swimmer isolation | Click-to-select segmentation via a local SAM 2 server, for crowded lanes |
| Lane selection | For multi-swimmer race footage, pick lane 1–10 and the coach ignores everyone else |
| Skeleton viewer | Frame scrubber with original, segmented and skeleton views; selecting an issue jumps to its frame |
| Pro comparison | Embedded reference videos of five world-class swimmers per stroke |
| Dashboard | Past analyses with per-stroke stats |
| Progress | Score trend over time and a latest-vs-previous radar chart, filterable by stroke |

## The analysis pipeline

Steps 1 and 3 run in the browser; the `/api/*` routes call out to OpenAI,
SAM 2 and Supabase.

```
1  extract     12 evenly spaced frames, ≤640 px, JPEG q0.7    lib/frame-extractor.ts
2  detect      GPT-4o, 3 frames at low detail → sport,         /api/detect-sport
               multiple athletes?, scene description
   ── one swimmer: skip to 4 ──
3a select      user clicks on themselves in frame 0            components/person-selector.tsx
3b segment     SAM 2.1 hiera-small, one point prompt/frame     /api/segment → sam2-server
3c skeleton    MediaPipe Pose Landmarker (lite, GPU), 33 pts   lib/pose-estimation.ts
3d lane        user picks a lane (swimming + several athletes)
4  analyse     GPT-4o, all 12 frames at high detail → JSON:    /api/analyze
               stroke, overall + 6 dimension scores,
               issues, frame notes, summary
5  store       video → Supabase Storage, result → `analyses`   /api/upload-video, /api/analyze
```

Skeleton detection only runs on SAM 2's segmented frames. On the single-swimmer
path, or when the SAM 2 server is not reachable, the result has no skeleton.

## Tech stack

- **Framework:** Next.js 16.1 (App Router), React 19.1, TypeScript 5.8
- **Styling:** Tailwind 4.1, lucide-react icons
- **Charts:** Recharts 3.8 (radar and progress line)
- **On-device ML:** MediaPipe Tasks Vision 0.10 (Pose Landmarker lite, loaded from CDN)
- **Auth:** Clerk 7 (`proxy.ts` protects `/dashboard`, `/analyze`, `/analysis`, `/progress`)
- **Data:** Supabase JS 2.99 — one `analyses` table plus a `videos` storage bucket
- **Cloud AI:** OpenAI SDK 6.29 with GPT-4o (JSON mode) for sport detection and analysis
- **Segmentation:** SAM 2.1 in a Python FastAPI server (`sam2-server/`), on MPS, CUDA or CPU

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev                        # localhost:3000
```

```bash
npm run build      # production build
npm run lint       # eslint
```

**Set up Supabase before the first analysis.** Run `supabase-schema.sql` in the
Supabase SQL editor, then create a public storage bucket named `videos`. The
schema file is behind the code: `saveAnalysis` also writes `keyframe_images`,
`segmentation_masks` and `video_url`, so add those columns (`jsonb`, `jsonb`,
`text`) or inserts will fail.

**The SAM 2 server is optional.** Without it `/api/segment` returns 503 and the
app carries on without segmentation or skeletons. To run it:

```bash
cd sam2-server
# install torch, fastapi, uvicorn, pillow, numpy and SAM 2; put
# sam2.1_hiera_small.pt in sam2-server/checkpoints/
python server.py   # serves on :8000 — GET /health, POST /segment
```

`three`, `@react-three/fiber`, `@react-three/drei` and `@ffmpeg/ffmpeg` are in
`package.json` but not imported anywhere yet; the skeleton viewer draws on a 2D
canvas.

### Environment variables

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard (server-only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `OPENAI_API_KEY` | platform.openai.com (server-only) |
| `SAM2_SERVER_URL` | optional; defaults to `http://localhost:8000` |

## Project layout

```
app/                  routes (App Router): landing, analyze, analysis/[id],
                      dashboard, progress
app/api/              analyze, detect-sport, segment, upload-video
components/           uploader flow, person selector, skeleton viewer,
                      score card, radar + progress charts, pro comparison
lib/                  OpenAI prompts, frame extraction, pose estimation,
                      SAM 2 client, Supabase access, pro swimmer data
sam2-server/          FastAPI SAM 2 segmentation server
proxy.ts              Clerk route protection
supabase-schema.sql   the analyses table and RLS policies
```

The real logic lives in two places. `components/video-uploader.tsx` is the
pipeline's state machine: it runs extraction, detection, person selection,
segmentation, pose estimation and lane selection in order. `lib/openai.ts` holds
both GPT-4o prompts and the JSON contract the rest of the app depends on;
`lib/utils.ts` maps its dimension keys to labels and `lib/skeleton-data.ts` maps
issue body parts to MediaPipe landmarks.

## Privacy

Unlike the analysis, which only sees frames, the full video is uploaded: it goes
to the Supabase `videos` bucket under a public URL. The twelve sampled frames go
to OpenAI and are also saved in the `analyses` row. When SAM 2 is used, frames
go to whatever host `SAM2_SERVER_URL` points at.

## Documentation

- [TODO.md](TODO.md) — roadmap: known bugs, analysis quality, UX, progress tracking, sharing, architecture, more sports (in Chinese)
- [supabase-schema.sql](supabase-schema.sql) — the `analyses` table, indexes and RLS policies
