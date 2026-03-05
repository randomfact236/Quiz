#!/bin/bash
# Install script for image reading dependencies
# Run: chmod +x install-image-deps.sh && ./install-image-deps.sh

set -e

echo "Installing image reading dependencies..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found. Please install Python 3.8+ first."
    exit 1
fi

echo "Installing Python packages..."

# Install basic image processing libraries
pip install Pillow

# Install OpenCV for advanced image processing
pip install opencv-python numpy

# Install Tesseract OCR bindings
pip install pytesseract

echo ""
echo "========================================"
echo "Python packages installed successfully!"
echo "========================================"
echo ""
echo "NOTE: For OCR text extraction, you also need to install Tesseract OCR engine:"
echo ""
echo "  macOS:    brew install tesseract"
echo "  Ubuntu:   sudo apt-get install tesseract-ocr"
echo "  Windows:  Download from https://github.com/UB-Mannheim/tesseract/wiki"
echo ""
echo "After installation, verify with: python3 scripts/read-image.py <image_path>"
echo ""
