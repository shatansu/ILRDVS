"""
Adaptive Preprocessing & Enhancement Engine for BhoomiVerify AI.
Transforms degraded, skewed, and faded land records into clean, recognition-ready pages
ready for the downstream OCR/HTR Layer.
"""

from typing import Dict, Any, Tuple
import cv2
import numpy as np
from pathlib import Path

def deskew_image(image: np.ndarray, angle: float) -> np.ndarray:
    """
    Rotates image to correct detected skew angle.
    """
    if abs(angle) < 0.5:
        return image

    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    # Negative angle for OpenCV rotation matrix
    m = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Calculate new bounding dimensions to prevent clipping
    cos = np.abs(m[0, 0])
    sin = np.abs(m[0, 1])
    new_w = int((h * sin) + (w * cos))
    new_h = int((h * cos) + (w * sin))
    m[0, 2] += (new_w / 2) - center[0]
    m[1, 2] += (new_h / 2) - center[1]

    # Fill background with white (255)
    return cv2.warpAffine(
        image, m, (new_w, new_h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255) if len(image.shape) == 3 else 255
    )

def enhance_contrast_clahe(gray_img: np.ndarray, clip_limit: float = 2.5) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to boost faint, faded Hindi/English ink on vintage parchment.
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    return clahe.apply(gray_img)

def sharpen_image(gray_img: np.ndarray) -> np.ndarray:
    """
    Applies unsharp masking to enhance soft or blurred character edges.
    """
    gaussian = cv2.GaussianBlur(gray_img, (0, 0), 2.0)
    # unsharp mask = 1.5 * original - 0.5 * blurred
    sharpened = cv2.addWeighted(gray_img, 1.5, gaussian, -0.5, 0)
    return sharpened

def denoise_document(gray_img: np.ndarray) -> np.ndarray:
    """
    Bilateral filter preserves sharp text edges while wiping out paper grain.
    """
    return cv2.bilateralFilter(gray_img, d=5, sigmaColor=50, sigmaSpace=50)

def enhance_page(
    image_path: Path,
    output_path: Path,
    skew_angle: float,
    needs_clahe: bool,
    needs_sharpening: bool,
    detected_orientation_angle: int = 0
) -> Dict[str, Any]:
    """
    Unified enhancement pipeline. Executes adaptive improvements and saves
    the clean recognition-ready image for the future OCR layer.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not load image for enhancement: {image_path}")

    operations_applied = []

    # 1. Orientation correction if 90/180/270 degrees
    if detected_orientation_angle == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        operations_applied.append("Orientation Corrected (90°)")
    elif detected_orientation_angle == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
        operations_applied.append("Orientation Corrected (180°)")
    elif detected_orientation_angle == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        operations_applied.append("Orientation Corrected (270°)")

    # 2. Deskew
    if abs(skew_angle) >= 0.8:
        img = deskew_image(img, skew_angle)
        operations_applied.append(f"Auto-Deskewed ({skew_angle:+.1f}°)")

    # Work on grayscale for text recognition prep
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()

    # 3. Denoising
    gray = denoise_document(gray)
    operations_applied.append("Bilateral Edge-Preserving Denoising")

    # 4. Contrast enhancement (CLAHE)
    if needs_clahe:
        gray = enhance_contrast_clahe(gray, clip_limit=2.5)
        operations_applied.append("Adaptive CLAHE Contrast Boost")

    # 5. Sharpening if blurry
    if needs_sharpening:
        gray = sharpen_image(gray)
        operations_applied.append("Unsharp Mask Edge Sharpening")

    # Save enhanced image
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), gray)

    return {
        "enhanced_image_path": str(output_path),
        "operations_applied": operations_applied,
        "is_ready_for_ocr": True
    }
