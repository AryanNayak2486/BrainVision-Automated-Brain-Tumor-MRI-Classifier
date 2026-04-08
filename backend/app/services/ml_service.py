import logging
import os
import time
from typing import Optional
import numpy as np
from app.config import settings
from app.utils.image_utils import preprocess_image, get_class_label, TUMOR_CLASSES

logger = logging.getLogger(__name__)

# Global model instance (loaded once)
_model = None


def load_model():
    """Load the InceptionV3 model. Call once at startup."""
    global _model
    if _model is not None:
        return _model

    model_path = settings.MODEL_PATH
    if not os.path.exists(model_path):
        logger.warning(
            f"Model file not found at {model_path}. "
            "Running in demo mode — predictions will be simulated."
        )
        return None

    try:
        import tensorflow as tf
        logger.info(f"Loading model from {model_path}...")
        _model = tf.keras.models.load_model(model_path)
        logger.info("Model loaded successfully.")
        return _model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


def get_model():
    """Return the cached model or attempt to load it."""
    global _model
    if _model is None:
        _model = load_model()
    return _model


def _demo_predict(image_bytes: bytes) -> dict:
    """
    Demo prediction used when the real model file is not present.
    Returns a deterministic-ish result based on image content.
    """
    import hashlib
    digest = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16)
    class_index = digest % len(TUMOR_CLASSES)
    raw_scores = np.random.default_rng(digest).dirichlet(alpha=[1, 1, 1, 1])
    # Boost the chosen class for realism
    raw_scores[class_index] += 1.5
    raw_scores = raw_scores / raw_scores.sum()

    confidences = {TUMOR_CLASSES[i]: float(raw_scores[i]) for i in range(len(TUMOR_CLASSES))}
    predicted_class = TUMOR_CLASSES[class_index]
    return {
        "predicted_class": predicted_class,
        "confidence": float(raw_scores[class_index]),
        "all_confidences": confidences,
        "demo_mode": True,
    }


def predict_tumor(image_bytes: bytes) -> dict:
    """
    Run inference on an MRI image.
    Returns prediction results with class label and confidence scores.
    """
    start_time = time.time()

    model = get_model()
    if model is None:
        result = _demo_predict(image_bytes)
        result["processing_time_ms"] = (time.time() - start_time) * 1000
        return result

    try:
        img_array = preprocess_image(image_bytes)
        predictions = model.predict(img_array, verbose=0)[0]

        predicted_index = int(np.argmax(predictions))
        predicted_class = get_class_label(predicted_index)
        confidence = float(predictions[predicted_index])

        all_confidences = {
            TUMOR_CLASSES[i]: float(predictions[i]) for i in range(len(TUMOR_CLASSES))
        }

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_confidences": all_confidences,
            "processing_time_ms": (time.time() - start_time) * 1000,
            "demo_mode": False,
        }
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise
