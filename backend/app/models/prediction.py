import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    image_filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=True)

    # Prediction results
    predicted_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    all_confidences = Column(JSON, nullable=True)  # {class: confidence} for all classes

    # Metadata
    model_version = Column(String(50), default="InceptionV3-v1")
    processing_time_ms = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="predictions")
