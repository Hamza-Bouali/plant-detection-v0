// API Configuration
// Update this URL when your ngrok/backend URL changes
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://popular-light-ocelot.ngrok-free.app"

export interface TopPrediction {
  class: string
  label: string
  score: number
}

export interface ClassificationResult {
  predicted_class: string
  predicted_label: string
  top_3: TopPrediction[]
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
 */
export async function classifyImageBase64(imageBase64: string): Promise<ClassificationResult> {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64

  const response = await fetch(`${API_BASE_URL}/predict_base64`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify({ image_base64: base64Data }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Classification failed")
  }

  return response.json()
}

/**
 * Send image file for classification using multipart form data
 */
export async function classifyImageFile(file: File): Promise<ClassificationResult> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "1",
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Classification failed")
  }

  return response.json()
}
