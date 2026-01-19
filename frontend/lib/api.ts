// API Configuration
// Update these URLs when your ngrok/backend URLs change
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://tamie-windproof-lino.ngrok-free.dev"
export const SEGMENTATION_API_URL = process.env.NEXT_PUBLIC_SEGMENTATION_API_URL || "https://alive-cheetah-precisely.ngrok-free.app"

export interface TopPrediction {
  class: string
  label: string
  score: number
}

export interface ClassificationResult {
  predicted_class: string
  predicted_label: string
  top_3: TopPrediction[]
  summary?: string
}

// Segmentation API types
export interface SeverityDetails {
  severity_score: number
  Ssurf: number   // Surface severity
  Sdens: number   // Density severity
  Sgrav: number   // Gravity severity
  Sdisp: number   // Dispersion severity
}

export interface Category {
  label: string   // e.g., "Moderate", "Severe"
  color: string   // e.g., "#FFA500"
}

export interface Stats {
  crop_size: number
  veg_pixels: number
  veg_ratio: number
}

export interface OutputImages {
  original: string   // Base64 encoded original image
  mask: string       // Base64 encoded segmentation mask
  overlay: string    // Base64 encoded overlay visualization
}

export interface SegmentationResult {
  severity: SeverityDetails
  category: Category
  stats: Stats
  images: OutputImages
}

export interface ApiError {
  detail: string
}

/**
 * Check if the API is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Send image for classification using base64 encoding
 * Uses local proxy to bypass CORS issues with ngrok
 */
export async function classifyImageBase64(imageBase64: string): Promise<ClassificationResult> {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64

  const response = await fetch("/api/classify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_base64: base64Data }),
  })

  if (!response.ok) {
    let message = "Classification failed"
    try {
      const error = await response.json()
      message = error.error || error.detail || message
    } catch {
      // Ignore JSON parse errors and use default message
    }
    throw new Error(message)
  }

  return response.json()
}

/**
 * Send image file for classification using multipart form data
 */
export async function classifyImageFile(file: File): Promise<ClassificationResult> {
  const base64 = await fileToBase64(file)
  return classifyImageBase64(base64)
}

/**
 * Send image for segmentation/severity analysis using base64 (converts to file)
 * Uses local proxy to bypass CORS issues with ngrok
 */
export async function segmentImageBase64(imageBase64: string): Promise<SegmentationResult> {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64

  const response = await fetch("/api/segment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_base64: base64Data }),
  })

  if (!response.ok) {
    let message = "Segmentation failed"
    try {
      const error = await response.json()
      message = error.error || error.detail || message
    } catch {
      // Ignore JSON parse errors and use default message
    }
    throw new Error(message)
  }

  return response.json()
}

/**
 * Check if the segmentation API is healthy
 */
export async function checkSegmentationHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SEGMENTATION_API_URL}/health`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
    return response.ok
  } catch {
    return false
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        resolve(result.includes(",") ? result.split(",")[1] : result)
      } else {
        reject(new Error("Unexpected file reader result"))
      }
    }
    reader.readAsDataURL(file)
  })
}
