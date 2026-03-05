@echo off
REM Install script for image reading dependencies (Windows)
REM Run: install-image-deps.bat

echo Installing image reading dependencies...

REM Install basic image processing libraries
echo Installing Pillow...
pip install Pillow

REM Install OpenCV for advanced image processing
echo Installing OpenCV and NumPy...
pip install opencv-python numpy

REM Install Tesseract OCR bindings
echo Installing pytesseract...
pip install pytesseract

echo.
echo ========================================
echo Python packages installed successfully!
echo ========================================
echo.
echo NOTE: For OCR text extraction, you also need to install Tesseract OCR engine:
echo.
echo   Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
echo   macOS:   brew install tesseract
echo   Ubuntu:  sudo apt-get install tesseract-ocr
echo.
echo After installation, verify with: python scripts\read-image.py ^<image_path^>
echo.

pause
