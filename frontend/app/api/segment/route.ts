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
    
    const response = await fetch(`${SEGMENTATION_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || "Segmentation failed" },
        { status: response.status }
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
