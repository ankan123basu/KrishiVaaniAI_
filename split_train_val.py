import os
import shutil
import random
from pathlib import Path

# Set these paths
DATASET_DIR = Path('data/PlantVillage')
TRAIN_DIR = DATASET_DIR / 'train'
VAL_DIR = DATASET_DIR / 'val'
SPLIT_RATIO = 0.8  # 80% train, 20% val

random.seed(42)

# Create train and val dirs
TRAIN_DIR.mkdir(exist_ok=True)
VAL_DIR.mkdir(exist_ok=True)

# Go through each class folder
for class_folder in [d for d in DATASET_DIR.iterdir() if d.is_dir() and d.name not in ['train', 'val']]:
    images = list(class_folder.glob('*.jpg'))
    random.shuffle(images)
    split_idx = int(len(images) * SPLIT_RATIO)
    train_imgs = images[:split_idx]
    val_imgs = images[split_idx:]

    # Create class subfolders
    (TRAIN_DIR / class_folder.name).mkdir(exist_ok=True)
    (VAL_DIR / class_folder.name).mkdir(exist_ok=True)

    for img in train_imgs:
        shutil.copy(str(img), str(TRAIN_DIR / class_folder.name / img.name))
    for img in val_imgs:
        shutil.copy(str(img), str(VAL_DIR / class_folder.name / img.name))

print('Done splitting!')
