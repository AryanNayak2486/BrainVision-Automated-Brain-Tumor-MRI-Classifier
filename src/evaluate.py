import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from src.config import MODEL_DIR
from src.data_loader import load_datasets

model = tf.keras.models.load_model(MODEL_DIR / "best_model.keras")
_, _, test_ds, class_names = load_datasets()

y_true = np.concatenate([y.numpy() for _, y in test_ds], axis=0)
y_true = np.argmax(y_true, axis=1)

y_pred_probs = model.predict(test_ds)
y_pred = np.argmax(y_pred_probs, axis=1)

print("Classification Report:\n")
print(classification_report(y_true, y_pred, target_names=class_names))

print("Confusion Matrix:\n")
print(confusion_matrix(y_true, y_pred))