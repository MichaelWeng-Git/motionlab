"""
SAM 2 segmentation server for MotionLab.
Runs locally, called by the Next.js app.
"""

import base64
import io
import os

import numpy as np
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = None


def get_predictor():
    global predictor
    if predictor is not None:
        return predictor

    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor

    if torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")

    print(f"Loading SAM 2 on {device}...")

    checkpoint = os.path.join(os.path.dirname(__file__), "checkpoints", "sam2.1_hiera_small.pt")
    model_cfg = "configs/sam2.1/sam2.1_hiera_s.yaml"

    sam2_model = build_sam2(model_cfg, checkpoint, device=device)
    predictor = SAM2ImagePredictor(sam2_model)

    print("SAM 2 loaded!")
    return predictor


def decode_base64_image(b64: str) -> np.ndarray:
    img_bytes = base64.b64decode(b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(img)


def encode_image_to_base64(img_array: np.ndarray, fmt: str = "PNG") -> str:
    img = Image.fromarray(img_array)
    buf = io.BytesIO()
    img.save(buf, format=fmt, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def create_mask_overlay(mask: np.ndarray) -> str:
    """Create a semi-transparent green overlay from mask."""
    h, w = mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[mask, 0] = 0
    rgba[mask, 1] = 255
    rgba[mask, 2] = 136
    rgba[mask, 3] = 180
    return encode_image_to_base64(rgba)


def create_segmented_image(image: np.ndarray, mask: np.ndarray) -> str:
    """Apply mask to image — keep person, black background."""
    result = image.copy()
    result[~mask] = 0
    return encode_image_to_base64(result, fmt="JPEG")


class SegmentRequest(BaseModel):
    frames: list[str]
    click_point: dict  # {"x": 0-1, "y": 0-1}


class FrameResult(BaseModel):
    mask: str          # base64 PNG mask overlay
    segmented: str     # base64 JPEG — person only, black bg
    score: float


class SegmentResponse(BaseModel):
    results: list[FrameResult]


@app.post("/segment", response_model=SegmentResponse)
def segment(req: SegmentRequest):
    pred = get_predictor()
    results = []

    for i, frame_b64 in enumerate(req.frames):
        try:
            image = decode_base64_image(frame_b64)
            h, w = image.shape[:2]

            pred.set_image(image)

            point_coords = np.array([[
                req.click_point["x"] * w,
                req.click_point["y"] * h,
            ]])
            point_labels = np.array([1])

            masks, scores, _ = pred.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True,
            )

            best_idx = int(np.argmax(scores))
            best_mask = masks[best_idx]
            best_score = float(scores[best_idx])

            mask_overlay = create_mask_overlay(best_mask)
            segmented = create_segmented_image(image, best_mask)

            results.append(FrameResult(
                mask=mask_overlay,
                segmented=segmented,
                score=best_score,
            ))
            print(f"Frame {i+1}/{len(req.frames)}: score={best_score:.3f}")

        except Exception as e:
            print(f"Frame {i+1} error: {e}")
            results.append(FrameResult(mask="", segmented="", score=0.0))

    return SegmentResponse(results=results)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": predictor is not None}


if __name__ == "__main__":
    import uvicorn
    get_predictor()
    uvicorn.run(app, host="0.0.0.0", port=8000)
