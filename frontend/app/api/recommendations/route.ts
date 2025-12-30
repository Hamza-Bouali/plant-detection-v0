import { NextResponse } from "next/server"
import { z } from "zod"
import OpenAI from "openai"

import {
  findBestKbMatch,
  type RecommendationPriority,
} from "@/lib/recommendation-kb"

type NormalizedPrediction = { label: string; score: number }
type NormalizedClassification = {
  predicted_label: string
  top_3: NormalizedPrediction[]
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeScore(v: unknown): number {
  const n = toNumber(v)
  if (n === null) return 0
  // Accept both 0..1 and 0..100 (percent) formats.
  const s = n > 1 && n <= 100 ? n / 100 : n
  return clamp01(s)
}

function normalizeClassification(rawBody: any): NormalizedClassification {
  const c = rawBody?.classification ?? rawBody ?? {}

  const rawPredictedLabel =
    (typeof c?.predicted_label === "string" && c.predicted_label) ||
    (typeof c?.predictedLabel === "string" && c.predictedLabel) ||
    (typeof c?.label === "string" && c.label) ||
    (typeof c?.predicted === "string" && c.predicted) ||
    ""

  const rawTop =
    (Array.isArray(c?.top_3) && c.top_3) ||
    (Array.isArray(c?.top3) && c.top3) ||
    (Array.isArray(c?.predictions) && c.predictions) ||
    []

  const top_3: NormalizedPrediction[] = rawTop
    .filter(Boolean)
    .map((p: any) => {
      const label =
        (typeof p?.label === "string" && p.label) ||
        (typeof p?.class === "string" && p.class) ||
        (typeof p?.name === "string" && p.name) ||
        (typeof p?.predicted_label === "string" && p.predicted_label) ||
        "unknown"
      const score = normalizeScore(p?.score ?? p?.confidence ?? p?.probability ?? p?.prob)
      return { label, score }
    })
    .sort((a: NormalizedPrediction, b: NormalizedPrediction) => b.score - a.score)
    .slice(0, 3)

  const predicted_label = rawPredictedLabel || top_3[0]?.label || "unknown"

  return { predicted_label, top_3 }
}

type AgentResponse = {
  mode: "openai" | "fallback"
  priority: RecommendationPriority
  title: string
  summary: string
  confidence: number
  kb: {
    id: string
    name: string
    matchScore: number
    matchedAlias: string | null
  }
  immediateActions: string[]
  treatmentOptions: string[]
  prevention: string[]
  monitoringPlan: string
  questionsForFarmer: string[]
  safetyNotes: string[]
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function buildFallbackResponse(input: {
  classification: NormalizedClassification
  crop?: string
  location?: string
  notes?: string
}): AgentResponse {
  const predictedLabel = input.classification.predicted_label
  const top1 = input.classification.top_3[0]?.score ?? 0
  const { entry, matchedAlias, score } = findBestKbMatch(predictedLabel)

  const confidence = clamp01(top1)

  return {
    mode: "fallback",
    priority: entry.defaultPriority,
    title: entry.name,
    summary: entry.summary,
    confidence,
    kb: {
      id: entry.id,
      name: entry.name,
      matchScore: score,
      matchedAlias,
    },
    immediateActions: entry.immediateActions,
    treatmentOptions: entry.treatmentOptions,
    prevention: entry.prevention,
    monitoringPlan:
      "Re-check symptoms in 48–72 hours. If symptoms spread to new leaves or neighboring plants, escalate and consider confirmatory diagnosis.",
    questionsForFarmer: [
      input.crop ? undefined : "What crop/variety is this?",
      input.location ? undefined : "What is your location/region and current weather (rain/humidity)?",
      "How many plants are affected (single plant, patch, or the whole field)?",
      "Any recent changes in irrigation, fertilizer, or pesticide sprays?",
    ].filter(Boolean) as string[],
    safetyNotes: [
      "Use only crop-registered products and follow label directions.",
      "Wear PPE (gloves, mask/respirator if required) when applying any pesticide.",
      "If you suspect late blight or a fast-spreading disease, contact local extension services promptly.",
    ],
  }
}

function extractJson(text: string): unknown {
  // Try direct parse first.
  try {
    return JSON.parse(text)
  } catch {
    // If Gemini wrapped it, try to pull the first JSON object.
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1)
      return JSON.parse(slice)
    }
    throw new Error("Failed to parse JSON from model output")
  }
}

export async function POST(req: Request) {
  let rawBody: any = null
  try {
    rawBody = await req.json()
  } catch {
    // ignore; we'll fallback
  }

  const classification = normalizeClassification(rawBody)
  const crop = typeof rawBody?.crop === "string" ? rawBody.crop : undefined
  const location = typeof rawBody?.location === "string" ? rawBody.location : undefined
  const notes = typeof rawBody?.notes === "string" ? rawBody.notes : undefined
  const language = typeof rawBody?.language === "string" ? rawBody.language : "en"

  // IMPORTANT: never hard-fail the UI with 400 here. If the request shape is weird,
  // we still return a useful fallback response.
  if (!classification.predicted_label || classification.predicted_label === "unknown") {
    return NextResponse.json(
      {
        ...buildFallbackResponse({ classification, crop, location, notes }),
        mode: "fallback",
        error: "Could not parse classification payload; returned generic fallback recommendations.",
      },
      { status: 200 },
    )
  }

  const predictedLabel = classification.predicted_label
  const top1 = classification.top_3[0]?.score ?? 0
  const top3 = classification.top_3
    .slice(0, 3)
    .map((p) => ({ label: p.label, score: clamp01(p.score) }))

  const kbMatch = findBestKbMatch(predictedLabel)

  const lang = (language || "en").trim() || "en"
  const cropTrim = crop?.trim()
  const locationTrim = location?.trim()
  const notesTrim = notes?.trim()

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    return NextResponse.json(buildFallbackResponse({ classification, crop, location, notes }), { status: 200 })
  }

  const openaiModel = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini"

  const promptText = [
    "You are an agronomy decision-support agent.",
    "You will be given a plant leaf classifier output and a SMALL internal knowledge base entry that best matches the label.",
    "Goal: produce safe, actionable, field-friendly recommendations.",
    "",
    "Rules:",
    "- Output MUST be valid JSON ONLY (no markdown, no backticks).",
    "- Be honest about uncertainty; do not overclaim diagnosis.",
    "- Do not propose illegal/unsafe chemicals. Always advise following local labels and regulations.",
    "- Prefer integrated pest management (IPM): cultural + sanitation + monitoring + then products if needed.",
    `- Respond in language: ${lang}.`,
    "",
    "Classifier output:",
    JSON.stringify(
      {
        predicted_label: predictedLabel,
        top_3: top3,
      },
      null,
      2,
    ),
    "",
    "Context (optional):",
    JSON.stringify({ crop: cropTrim, location: locationTrim, notes: notesTrim }, null, 2),
    "",
    "Knowledge base match (use this to ground actions):",
    JSON.stringify(
      {
        id: kbMatch.entry.id,
        name: kbMatch.entry.name,
        summary: kbMatch.entry.summary,
        immediateActions: kbMatch.entry.immediateActions,
        treatmentOptions: kbMatch.entry.treatmentOptions,
        prevention: kbMatch.entry.prevention,
        whenToEscalate: kbMatch.entry.whenToEscalate,
        defaultPriority: kbMatch.entry.defaultPriority,
        matchedAlias: kbMatch.matchedAlias,
        matchScore: kbMatch.score,
      },
      null,
      2,
    ),
    "",
    "Return JSON with EXACT keys:",
    JSON.stringify(
      {
        priority: "Low | Moderate | Urgent | Critical",
        title: "short title",
        summary: "2-4 short sentences",
        confidence: "number 0..1 (use classifier top-1 score as base, reduce if uncertainty is high)",
        immediateActions: ["3-6 bullets"],
        treatmentOptions: ["2-6 bullets"],
        prevention: ["3-6 bullets"],
        monitoringPlan: "1-3 sentences",
        questionsForFarmer: ["2-6 bullets"],
        safetyNotes: ["2-5 bullets"],
      },
      null,
      2,
    ),
  ].join("\n")

  try {
    const client = new OpenAI({ apiKey: openaiApiKey })
    const res = await client.chat.completions.create({
      model: openaiModel,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
      // Encourage strict JSON output.
      response_format: { type: "json_object" },
    })

    const content = res.choices?.[0]?.message?.content || ""
    const json = extractJson(content)

    const ResponseSchema = z.object({
      priority: z.enum(["Low", "Moderate", "Urgent", "Critical"]),
      title: z.string().min(1),
      summary: z.string().min(1),
      confidence: z.number().min(0).max(1),
      immediateActions: z.array(z.string()).default([]),
      treatmentOptions: z.array(z.string()).default([]),
      prevention: z.array(z.string()).default([]),
      monitoringPlan: z.string().default(""),
      questionsForFarmer: z.array(z.string()).default([]),
      safetyNotes: z.array(z.string()).default([]),
    })

    const validated = ResponseSchema.parse(json)

    const out: AgentResponse = {
      mode: "openai",
      ...validated,
      // Keep the KB attribution so the UI can show what grounded the answer.
      kb: {
        id: kbMatch.entry.id,
        name: kbMatch.entry.name,
        matchScore: kbMatch.score,
        matchedAlias: kbMatch.matchedAlias,
      },
      // If the model outputs weird confidence, anchor it slightly to classifier top-1.
      confidence: clamp01(0.7 * validated.confidence + 0.3 * clamp01(top1)),
    }

    return NextResponse.json(out, { status: 200 })
  } catch (e) {
    // If OpenAI fails (quota, bad key, etc.), degrade gracefully.
    const fallback = buildFallbackResponse({ classification, crop, location, notes })
    return NextResponse.json(
      {
        ...fallback,
        mode: "fallback",
        safetyNotes: [
          ...fallback.safetyNotes,
          "Note: AI recommendations service was unavailable; showing fallback guidance from the local knowledge base.",
        ],
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 200 },
    )
  }
}


