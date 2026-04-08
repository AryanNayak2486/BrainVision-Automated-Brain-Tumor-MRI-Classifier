from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
TRAIN_DIR = DATA_DIR / "train"
TEST_DIR = DATA_DIR / "test"
MODEL_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42
NUM_CLASSES = 4
CLASS_NAMES = ["Glioma", "Meningioma", "No_Tumor", "Pituitary"]

INITIAL_EPOCHS = 10
FINE_TUNE_EPOCHS = 10
INITIAL_LR = 1e-3
FINE_TUNE_LR = 1e-5
UNFREEZE_FROM = 140