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
    
    // Convert base64 to buffer and create proper multipart/form-data
    const buffer = Buffer.from(imageBase64, "base64")
    const blob = new Blob([buffer], { type: "image/jpeg" })
    
    const formData = new FormData()
    formData.append("file", blob, "image.jpg")
    
    // Add size query parameter as required by the API
    const response = await fetch(`${SEGMENTATION_API_URL}/predict?size=384`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "1",
        // Don't set Content-Type - let fetch set it with boundary
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

    // The API returns a PNG image (the mask), not JSON
    // We need to convert it to base64 and construct a mock SegmentationResult
    const imageBuffer = await response.arrayBuffer()
    const maskBase64 = Buffer.from(imageBuffer).toString("base64")
    
    // Create a response that matches our SegmentationResult interface
    // Note: This is a simplified response since the API only returns the mask
    const data = {
      severity: {
        severity_score: 0,
        Ssurf: 0,
        Sdens: 0,
        Sgrav: 0,
        Sdisp: 0,
      },
      category: {
        label: "Unknown",
        color: "#808080",
      },
      stats: {
        crop_size: 0,
        veg_pixels: 0,
        veg_ratio: 0,
      },
      images: {
        original: imageBase64,
        mask: maskBase64,
        overlay: maskBase64, // Use mask as overlay since we only have the mask
      },
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Segmentation API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to segmentation service" },
      { status: 500 }
    )
  }
}
