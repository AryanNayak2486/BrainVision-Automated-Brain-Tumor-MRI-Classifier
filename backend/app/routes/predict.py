import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.ml_service import predict_tumor
from app.utils.image_utils import validate_image
from app.utils.report_utils import generate_prediction_report
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Predictions"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_FILE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


# --- Schemas ---

class PredictionResponse(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    all_confidences: dict
    model_version: str
    processing_time_ms: float
    image_filename: str
    demo_mode: bool = False

    class Config:
        from_attributes = True


class BatchPredictionResponse(BaseModel):
    results: List[PredictionResponse]
    total: int
    failed: int


# --- Helpers ---

def _save_prediction(db: Session, user_id, result: dict, filename: str) -> Prediction:
    pred = Prediction(
        user_id=user_id,
        image_filename=filename,
        predicted_class=result["predicted_class"],
        confidence=result["confidence"],
        all_confidences=result["all_confidences"],
        processing_time_ms=result.get("processing_time_ms", 0),
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


# --- Endpoints ---

@router.post("/", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_single(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run inference on a single MRI image."""
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB allowed.")

    if not validate_image(image_bytes):
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")

    result = predict_tumor(image_bytes)
    saved = _save_prediction(db, current_user.id, result, file.filename or "upload.jpg")

    return {
        "id": str(saved.id),
        "predicted_class": saved.predicted_class,
        "confidence": saved.confidence,
        "all_confidences": saved.all_confidences,
        "model_version": saved.model_version,
        "processing_time_ms": saved.processing_time_ms,
        "image_filename": saved.image_filename,
        "demo_mode": result.get("demo_mode", False),
    }


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run inference on multiple MRI images (up to 10)."""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch.")

    results = []
    failed = 0

    for file in files:
        try:
            image_bytes = await file.read()
            if len(image_bytes) > MAX_FILE_BYTES or not validate_image(image_bytes):
                failed += 1
                continue
            result = predict_tumor(image_bytes)
            saved = _save_prediction(db, current_user.id, result, file.filename or "upload.jpg")
            results.append({
                "id": str(saved.id),
                "predicted_class": saved.predicted_class,
                "confidence": saved.confidence,
                "all_confidences": saved.all_confidences,
                "model_version": saved.model_version,
                "processing_time_ms": saved.processing_time_ms,
                "image_filename": saved.image_filename,
                "demo_mode": result.get("demo_mode", False),
            })
        except Exception as e:
            logger.warning(f"Failed to process file {file.filename}: {e}")
            failed += 1

    return {"results": results, "total": len(files), "failed": failed}


@router.get("/{prediction_id}/report")
def download_report(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a PDF report for a prediction."""
    pred = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id,
    ).first()

    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    user_data = {
        "full_name": current_user.full_name,
        "username": current_user.username,
    }
    prediction_data = {
        "id": str(pred.id),
        "predicted_class": pred.predicted_class,
        "confidence": pred.confidence,
        "all_confidences": pred.all_confidences,
        "model_version": pred.model_version,
        "processing_time_ms": pred.processing_time_ms,
        "image_filename": pred.image_filename,
        "created_at": pred.created_at.strftime("%Y-%m-%d %H:%M UTC") if pred.created_at else "",
    }

    pdf_bytes = generate_prediction_report(prediction_data, user_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="brainvision_report_{prediction_id[:8]}.pdf"'},
    )
