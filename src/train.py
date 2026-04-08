import tensorflow as tf
from pathlib import Path
from src.config import (
    MODEL_DIR, OUTPUT_DIR,
    INITIAL_EPOCHS, FINE_TUNE_EPOCHS,
    INITIAL_LR, FINE_TUNE_LR, UNFREEZE_FROM
)
from src.data_loader import load_datasets
from src.model import build_model

MODEL_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

train_ds, val_ds, test_ds, class_names = load_datasets()
model, base_model = build_model()

model.compile(
    optimizer=tf.keras.optimizers.Adam(INITIAL_LR),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        filepath=str(MODEL_DIR / "best_model.keras"),
        monitor="val_accuracy",
        save_best_only=True,
        mode="max"
    ),
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=4,
        restore_best_weights=True
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2
    )
]

history_1 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=INITIAL_EPOCHS,
    callbacks=callbacks
)

base_model.trainable = True
for layer in base_model.layers[:UNFREEZE_FROM]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(FINE_TUNE_LR),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

history_2 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=FINE_TUNE_EPOCHS,
    callbacks=callbacks
)

model.save(MODEL_DIR / "final_model.keras")

test_loss, test_acc = model.evaluate(test_ds)
print(f"Test Accuracy: {test_acc:.4f}")