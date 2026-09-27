# MotionLab

AI swimming motion analysis — upload a video of your stroke, get a score, a skeleton overlay and specific technique feedback.

**Live:** [motionlab-five.vercel.app](https://motionlab-five.vercel.app)

## Features

- **Video analysis** — frames are extracted in the browser and scored by GPT-4o across technique dimensions
- **Pose estimation** — MediaPipe skeleton tracking with a 3D viewer (react-three-fiber)
- **Swimmer segmentation** — optional SAM 2 server to isolate one swimmer in a crowded lane
- **Pro comparison** — compare your stroke against reference pro swimmers
- **Progress tracking** — radar chart per analysis and score history over time

## Stack

- **Next.js 16** (App Router, React 19) + **Tailwind v4**
- **Clerk** — auth
- **Supabase** — Postgres + video storage
- **OpenAI GPT-4o** — analysis
- **MediaPipe Tasks Vision**, **ffmpeg.wasm**, **three.js**, **Recharts**
- **SAM 2** (Python / FastAPI) — segmentation server in `sam2-server/`

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `OPENAI_API_KEY` | platform.openai.com |
| `SAM2_SERVER_URL` | Optional, defaults to `http://localhost:8000` |

Create the tables by running `supabase-schema.sql` in the Supabase SQL editor.

### SAM 2 server (optional)

```bash
cd sam2-server
# install torch, fastapi, uvicorn, pillow and SAM 2; put
# sam2.1_hiera_small.pt in sam2-server/checkpoints/
python server.py   # serves on :8000
```

## Project layout

```
app/
  analyze/          # upload + run an analysis
  analysis/[id]/    # result page
  dashboard/        # past analyses
  progress/         # score history
  api/              # analyze, upload-video, segment, detect-sport
components/         # uploader, score card, radar/progress charts, skeleton viewer
lib/                # OpenAI, pose estimation, frame extraction, SAM 2 client, Supabase
sam2-server/        # FastAPI SAM 2 segmentation server
```

See [TODO.md](TODO.md) for the roadmap.
