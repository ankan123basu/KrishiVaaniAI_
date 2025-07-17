#!/bin/bash
# Exit on any error
set -e

# Install Python 3.10
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv python3-pip

# Create and activate virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install PyTorch CPU first (specific version for Python 3.10)
pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu

# Install other requirements
pip install -r requirements.txt --no-deps

# Install remaining dependencies
pip install Flask==3.0.0 flask-cors==4.0.0 python-dotenv==1.0.0 requests==2.31.0 gTTS==2.4.0 google-generativeai==0.4.0 gunicorn==21.2.0
