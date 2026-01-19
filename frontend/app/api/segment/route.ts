import { NextRequest, NextResponse } from "next/server"

const SEGMENTATION_API_URL = process.env.NEXT_PUBLIC_SEGMENTATION_API_URL || "https://alive-cheetah-precisely.ngrok-free.app"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Strip data URL prefix if present
    let imageBase64 = body.image_base64 as string
    if (imageBase64.includes(",")) {
      imageBase64 = imageBase64.split(",")[1]
    }
    
    // Convert base64 to buffer for multipart/form-data (Node.js runtime)
    const buffer = Buffer.from(imageBase64, "base64")
    const blob = new Blob([buffer], { type: "image/jpeg" })
    
    // Create FormData with file field (as per OpenAPI spec)
    const formData = new FormData()
    formData.append("file", blob, "image.jpg")
    
    // Try adding Accept header to request JSON response
    const response = await fetch(`${SEGMENTATION_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "1",
        // Note: Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || "Segmentation failed" },
        { status: response.status }
      )
    }

    // Check if response is JSON or binary (PNG/image)
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("image")) {
      // API returned an image instead of JSON - this might be the mask/overlay
      console.error("Segmentation API returned image, expected JSON")
      return NextResponse.json(
        { error: "API returned image instead of JSON response" },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Segmentation API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to segmentation service" },
      { status: 500 }
    )
  }
}
