import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://tamie-windproof-lino.ngrok-free.dev"

function extractScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (value && typeof value === "object") {
    const candidateKeys = [
      "probability",
      "confidence",
      "score",
      "prob",
      "likelihood",
    ]

    for (const key of candidateKeys) {
      const v = (value as Record<string, unknown>)[key]
      if (typeof v === "number" && Number.isFinite(v)) {
        return v
      }
    }

    const numericValues = Object.values(value as Record<string, unknown>)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))

    if (numericValues.length > 0) {
      return Math.max(...numericValues)
    }
  }
  return 0
}

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  if (score > 1 && score <= 100) {
    return score / 100
  }
  if (score < 0) return 0
  if (score > 1) return 1
  return score
}

function extractClassName(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const v = (value as Record<string, unknown>)["class"]
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim()
    }
  }
  return fallback
}

function normalizeLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function normalizeResponse(data: any) {
  const predictions = data?.predictions ?? {}
  const predictedClasses = data?.predicted_classes ?? {}
  const summary = typeof data?.summary === "string" ? data.summary : ""

  const flattened = Object.entries(predictions)
    .map(([label, value]) => {
      const score = normalizeScore(extractScore(value))
      const className = normalizeLabel(extractClassName(value, label))
      return {
        class: className,
        label: normalizeLabel(label) || className,
        score,
      }
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)

  const top_3 = flattened.slice(0, 3)

  let bestLabel = top_3[0]?.label ?? "unknown"
  let bestValue = Number.NEGATIVE_INFINITY

  if (predictedClasses && typeof predictedClasses === "object") {
    for (const [label, value] of Object.entries(predictedClasses)) {
      if (typeof value === "number" && value > bestValue) {
        bestLabel = normalizeLabel(label)
        bestValue = value
      }
    }
  }

  if (!bestLabel || bestLabel === "unknown") {
    bestLabel = summary || "unknown"
  }

  return {
    predicted_class: bestLabel,
    predicted_label: bestLabel,
    summary,
    top_3,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const base64 = typeof body?.image_base64 === "string" ? body.image_base64 : null
    if (!base64) {
      return NextResponse.json(
        { error: "image_base64 is required" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(base64, "base64")
    const blob = new Blob([buffer], { type: "image/jpeg" })
    const formData = new FormData()
    formData.append("file", blob, "image.jpg")

    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "1",
        "Accept": "application/json",
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Classification API error: ${response.status} - ${error}`)
      console.error(`Attempted URL: ${API_URL}/predict`)
      return NextResponse.json(
        { error: error || "Classification failed" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const normalized = normalizeResponse(data)
    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Classification API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to classification service" },
      { status: 500 }
    )
  }
}
