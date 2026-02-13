#!/usr/bin/env python3
"""
Image Reader Script
Reads and analyzes design reference images for the AI Quiz project.
"""

import os
import sys

def analyze_image_with_pil(image_path: str) -> dict:
    """Analyze image using PIL (Python Imaging Library)."""
    try:
        from PIL import Image
        
        img = Image.open(image_path)
        
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.width,
            "height": img.height,
            "info": img.info
        }
    except ImportError:
        return {"error": "PIL not installed. Run: pip install Pillow"}
    except Exception as e:
        return {"error": str(e)}

def analyze_image_with_cv2(image_path: str) -> dict:
    """Analyze image using OpenCV."""
    try:
        import cv2
        import numpy as np
        
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Could not read image with OpenCV"}
        
        height, width, channels = img.shape
        
        # Get dominant colors
        data = np.reshape(img, (-1, 3))
        data = np.float32(data)
        
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(data, 5, None, criteria, 10, flags)
        
        dominant_colors = centers.astype(int).tolist()
        
        return {
            "width": width,
            "height": height,
            "channels": channels,
            "dominant_colors_rgb": dominant_colors
        }
    except ImportError:
        return {"error": "OpenCV not installed. Run: pip install opencv-python"}
    except Exception as e:
        return {"error": str(e)}

def extract_text_with_ocr(image_path: str) -> str:
    """Extract text from image using OCR."""
    try:
        import pytesseract
        from PIL import Image
        
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except ImportError:
        return "pytesseract not installed. Run: pip install pytesseract and install Tesseract OCR"
    except Exception as e:
        return f"Error: {str(e)}"

def describe_image_with_ai(image_path: str) -> str:
    """Describe image using AI vision if available."""
    try:
        import base64
        from openai import OpenAI
        
        client = OpenAI()
        
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this web design in detail. What are the main sections, colors, layout, and key elements? Provide a structured description that could be used to recreate this design."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    except ImportError:
        return "OpenAI library not installed. Run: pip install openai"
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    """Main function to read and analyze images."""
    # Default image path
    default_image = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 
        "image", 
        "home page.png"
    )
    
    # Get image path from command line or use default
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = default_image
    
    print("=" * 60)
    print("IMAGE ANALYZER FOR AI QUIZ PROJECT")
    print("=" * 60)
    
    if not os.path.exists(image_path):
        print(f"\n❌ Error: Image not found at '{image_path}'")
        print(f"\nUsage: python {sys.argv[0]} [image_path]")
        sys.exit(1)
    
    print(f"\n📁 Analyzing: {image_path}")
    print("-" * 60)
    
    # Basic image info
    print("\n📊 BASIC IMAGE INFO:")
    pil_info = analyze_image_with_pil(image_path)
    if "error" not in pil_info:
        print(f"  Format: {pil_info.get('format')}")
        print(f"  Mode: {pil_info.get('mode')}")
        print(f"  Size: {pil_info.get('width')}x{pil_info.get('height')} pixels")
    else:
        print(f"  {pil_info['error']}")
    
    # OpenCV analysis
    print("\n🎨 COLOR ANALYSIS:")
    cv2_info = analyze_image_with_cv2(image_path)
    if "error" not in cv2_info:
        print(f"  Dimensions: {cv2_info['width']}x{cv2_info['height']}")
        print(f"  Channels: {cv2_info['channels']}")
        print("  Dominant Colors (RGB):")
        for i, color in enumerate(cv2_info.get('dominant_colors_rgb', []), 1):
            r, g, b = [int(c) for c in color]
            print(f"    {i}. RGB({r}, {g}, {b})")
    else:
        print(f"  {cv2_info['error']}")
    
    # OCR text extraction
    print("\n📝 TEXT EXTRACTION (OCR):")
    text = extract_text_with_ocr(image_path)
    if text and not text.startswith("pytesseract") and not text.startswith("Error"):
        print(f"  Extracted Text:\n{text[:500]}...")
    else:
        print(f"  {text}")
    
    # AI description
    print("\n🤖 AI DESCRIPTION:")
    ai_desc = describe_image_with_ai(image_path)
    if not ai_desc.startswith("OpenAI") and not ai_desc.startswith("Error"):
        print(f"\n{ai_desc}")
    else:
        print(f"  {ai_desc}")
    
    print("\n" + "=" * 60)
    print("Analysis complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()