#!/bin/bash
# Set Python version
pyenv install 3.10.13 -s
pyenv global 3.10.13

# Install dependencies
pip install -r requirements.txt

# Install PyTorch with CPU-only version (smaller and faster to install)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cpu

# Make sure the script is executable
chmod +x build.sh
