import io
import numpy as np
from PIL import Image
from app.config import settings


TUMOR_CLASSES = ["Glioma", "Meningioma", "No Tumor", "Pituitary"]


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess MRI image for InceptionV3 inference."""
    image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if grayscale or RGBA
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Resize to InceptionV3 input size (299x299)
    target_size = (settings.MODEL_INPUT_SIZE, settings.MODEL_INPUT_SIZE)
    image = image.resize(target_size, Image.LANCZOS)

    # Convert to numpy array and normalize to [-1, 1] (InceptionV3 preprocess_input)
    img_array = np.array(image, dtype=np.float32)
    img_array = (img_array / 127.5) - 1.0

    # Add batch dimension
    return np.expand_dims(img_array, axis=0)


def validate_image(image_bytes: bytes) -> bool:
    """Validate that the uploaded file is a valid image."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False


def get_class_label(class_index: int) -> str:
    """Convert class index to human-readable label."""
    return TUMOR_CLASSES[class_index]
