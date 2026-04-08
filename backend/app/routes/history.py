from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel

from app.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/history", tags=["History"])


# --- Schemas ---

class PredictionHistoryItem(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    all_confidences: dict
    image_filename: str
    model_version: str
    processing_time_ms: float | None
    created_at: str

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    items: List[PredictionHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class StatsResponse(BaseModel):
    total_predictions: int
    class_distribution: dict
    average_confidence: float
    recent_predictions: List[PredictionHistoryItem]


# --- Endpoints ---

@router.get("/", response_model=HistoryResponse)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    predicted_class: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve paginated prediction history for the current user."""
    query = db.query(Prediction).filter(Prediction.user_id == current_user.id)

    if search:
        query = query.filter(Prediction.image_filename.ilike(f"%{search}%"))
    if predicted_class:
        query = query.filter(Prediction.predicted_class == predicted_class)

    total = query.count()
    items = (
        query.order_by(desc(Prediction.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    def _serialize(p: Prediction) -> dict:
        return {
            "id": str(p.id),
            "predicted_class": p.predicted_class,
            "confidence": p.confidence,
            "all_confidences": p.all_confidences or {},
            "image_filename": p.image_filename,
            "model_version": p.model_version or "InceptionV3-v1",
            "processing_time_ms": p.processing_time_ms,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        }

    return {
        "items": [_serialize(p) for p in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return summary statistics for the current user's predictions."""
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()

    if not predictions:
        return {
            "total_predictions": 0,
            "class_distribution": {},
            "average_confidence": 0.0,
            "recent_predictions": [],
        }

    class_dist: dict[str, int] = {}
    total_conf = 0.0

    for p in predictions:
        class_dist[p.predicted_class] = class_dist.get(p.predicted_class, 0) + 1
        total_conf += p.confidence

    recent = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(desc(Prediction.created_at))
        .limit(5)
        .all()
    )

    def _serialize(p: Prediction) -> dict:
        return {
            "id": str(p.id),
            "predicted_class": p.predicted_class,
            "confidence": p.confidence,
            "all_confidences": p.all_confidences or {},
            "image_filename": p.image_filename,
            "model_version": p.model_version or "InceptionV3-v1",
            "processing_time_ms": p.processing_time_ms,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        }

    return {
        "total_predictions": len(predictions),
        "class_distribution": class_dist,
        "average_confidence": total_conf / len(predictions),
        "recent_predictions": [_serialize(p) for p in recent],
    }


@router.delete("/{prediction_id}", status_code=204)
def delete_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific prediction record."""
    pred = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id,
    ).first()

    if not pred:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prediction not found")

    db.delete(pred)
    db.commit()
