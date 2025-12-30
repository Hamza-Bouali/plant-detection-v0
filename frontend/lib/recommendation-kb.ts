export type RecommendationPriority = "Low" | "Moderate" | "Urgent" | "Critical"

export interface KnowledgeBaseEntry {
  /** Stable id used for attribution/debugging */
  id: string
  /** Human-readable name */
  name: string
  /**
   * Label aliases/patterns we may receive from the classifier.
   * Use lowercase strings; matching is substring-based.
   */
  labelAliases: string[]
  /**
   * Short agronomic summary that’s safe to show to users.
   * Avoid promising certainty; the classifier can be wrong.
   */
  summary: string
  /** What farmers should do immediately (first 24–48h) */
  immediateActions: string[]
  /** Treatment options (chemical/biological/cultural) */
  treatmentOptions: string[]
  /** Prevention tips */
  prevention: string[]
  /** When to escalate to an agronomist/lab */
  whenToEscalate: string[]
  /** Default priority if matched */
  defaultPriority: RecommendationPriority
}

/**
 * Small, practical knowledge base.
 * Keep entries short, action-oriented, and broadly applicable across crops.
 */
export const RECOMMENDATION_KB: KnowledgeBaseEntry[] = [
  {
    id: "kb-healthy",
    name: "Healthy leaf",
    labelAliases: ["healthy", "normal"],
    summary:
      "The leaf appears healthy. Continue good agronomic practices and keep monitoring to catch issues early.",
    immediateActions: [
      "Inspect 5–10 plants across the field to confirm the pattern is consistent.",
      "Record irrigation and fertilization schedules for the last 2 weeks.",
    ],
    treatmentOptions: [
      "No treatment needed if plants are vigorous and no spread is observed.",
    ],
    prevention: [
      "Avoid over-irrigation and prolonged leaf wetness where possible.",
      "Maintain balanced nutrition (N-P-K + micronutrients) based on soil/leaf tests.",
      "Scout weekly, especially after rain or rapid temperature shifts.",
    ],
    whenToEscalate: [
      "If symptoms appear on new growth or spread rapidly across multiple plots.",
    ],
    defaultPriority: "Low",
  },
  {
    id: "kb-powdery-mildew",
    name: "Powdery mildew (fungal)",
    labelAliases: ["powdery", "mildew"],
    summary:
      "Common fungal disease that often looks like white/gray powdery patches. Spreads fast in dense canopies with poor airflow.",
    immediateActions: [
      "Remove heavily infected leaves (do not compost if infection is active).",
      "Improve airflow: reduce canopy density and avoid overhead irrigation.",
    ],
    treatmentOptions: [
      "Use an approved fungicide for your crop (rotate modes of action to reduce resistance).",
      "Consider sulfur-based or biological options where appropriate and label-approved.",
    ],
    prevention: [
      "Avoid excess nitrogen that creates soft, dense growth.",
      "Space plants to improve airflow; prune if applicable.",
      "Irrigate early in the day to reduce humidity duration.",
    ],
    whenToEscalate: [
      "If infection spreads despite 2 treatment intervals.",
      "If you suspect fungicide resistance (no response to correct application).",
    ],
    defaultPriority: "Urgent",
  },
  {
    id: "kb-early-blight",
    name: "Early blight (Alternaria)",
    labelAliases: ["early_blight", "alternaria", "target spot", "target_spot"],
    summary:
      "Typically causes dark lesions that may show concentric rings. Often starts on older leaves and can reduce yield if unchecked.",
    immediateActions: [
      "Remove diseased lower leaves to reduce inoculum.",
      "Avoid wetting foliage; improve drainage and spacing.",
    ],
    treatmentOptions: [
      "Apply a crop-registered fungicide; rotate modes of action.",
      "Use preventive sprays when conditions are favorable (warm + humid).",
    ],
    prevention: [
      "Rotate crops (2–3 years) away from susceptible hosts if possible.",
      "Use clean seed/transplants and remove plant debris after harvest.",
    ],
    whenToEscalate: [
      "If lesions appear rapidly on upper canopy or stems.",
      "If you cannot distinguish from late blight (requires urgent management).",
    ],
    defaultPriority: "Urgent",
  },
  {
    id: "kb-late-blight",
    name: "Late blight (Phytophthora)",
    labelAliases: ["late_blight", "phytophthora"],
    summary:
      "High-risk disease that can spread explosively under cool, wet conditions. Requires fast action and correct identification.",
    immediateActions: [
      "Isolate affected area and avoid moving tools/workers through wet foliage.",
      "Remove and destroy heavily infected plants where recommended locally.",
    ],
    treatmentOptions: [
      "Use locally recommended, registered oomycete-targeting products for your crop.",
      "Follow strict spray intervals and rotate modes of action.",
    ],
    prevention: [
      "Avoid overhead irrigation; manage leaf wetness duration.",
      "Use resistant varieties if available and locally recommended.",
    ],
    whenToEscalate: [
      "Immediately contact an agronomist/extension service to confirm diagnosis.",
      "Consider lab confirmation if outbreaks are suspected in the region.",
    ],
    defaultPriority: "Critical",
  },
  {
    id: "kb-bacterial-spot",
    name: "Bacterial spot/speck (bacterial)",
    labelAliases: ["bacterial", "spot", "speck"],
    summary:
      "Often linked to splashing water, storms, and contaminated seed/transplants. Chemical control is limited; sanitation matters.",
    immediateActions: [
      "Avoid working in fields when leaves are wet to reduce spread.",
      "Remove severely affected leaves/plants if practical.",
    ],
    treatmentOptions: [
      "Use crop-registered bactericides/copper products only as label-approved; avoid overuse.",
      "Focus on cultural control: sanitation and moisture management.",
    ],
    prevention: [
      "Use certified disease-free seed/transplants.",
      "Disinfect tools; manage weeds and volunteer hosts.",
      "Reduce overhead irrigation and splash.",
    ],
    whenToEscalate: [
      "If symptoms worsen rapidly after rain and spread in hot weather.",
      "If you need lab confirmation to differentiate from fungal leaf spots.",
    ],
    defaultPriority: "Urgent",
  },
  {
    id: "kb-nutrient-deficiency",
    name: "Likely nutrient deficiency / stress",
    labelAliases: ["deficiency", "chlorosis", "yellow", "nutrient", "stress"],
    summary:
      "Yellowing or uneven coloration can be caused by nutrient imbalance, pH issues, water stress, or root problems.",
    immediateActions: [
      "Check irrigation uniformity and recent weather extremes (heat/cold).",
      "Inspect roots (if possible) for rot, compaction, or pests.",
      "If available, do a quick soil pH/EC check and review fertilizer history.",
    ],
    treatmentOptions: [
      "Correct nutrition based on soil/leaf test results; avoid large blind fertilizer applications.",
      "If micronutrient deficiency is suspected, consider a labeled foliar feed at recommended dose.",
    ],
    prevention: [
      "Use soil tests pre-season and adjust pH and base fertilization accordingly.",
      "Avoid overwatering; improve drainage and soil structure.",
    ],
    whenToEscalate: [
      "If new growth is severely affected or symptoms persist after corrective actions.",
      "If multiple plots show the same symptoms (possible irrigation/fertilizer issue).",
    ],
    defaultPriority: "Moderate",
  },
  {
    id: "kb-generic-disease",
    name: "Generic leaf disease (unclassified)",
    labelAliases: ["disease", "leaf", "spot", "blight", "rust", "mosaic", "virus"],
    summary:
      "A disease/stress pattern is suspected, but the exact cause is uncertain. Use integrated management and confirm with field checks.",
    immediateActions: [
      "Scout a wider area to estimate spread (edge vs. uniform).",
      "Remove badly affected leaves and improve airflow where possible.",
      "Avoid overhead irrigation and reduce leaf wetness duration.",
    ],
    treatmentOptions: [
      "If fungal disease is likely, use a crop-registered fungicide and rotate modes of action.",
      "If viral symptoms are suspected, focus on vector control and remove infected plants early.",
    ],
    prevention: [
      "Rotate crops and remove plant debris after harvest.",
      "Use clean planting material and sanitize tools.",
      "Monitor pests that can transmit diseases (aphids, whiteflies, thrips).",
    ],
    whenToEscalate: [
      "If symptoms spread rapidly or the crop is near a critical growth stage.",
      "If you need a confirmed diagnosis before applying treatments.",
    ],
    defaultPriority: "Urgent",
  },
]

export function normalizeLabel(label: string): string {
  return (label || "").toLowerCase().replace(/\s+/g, "_")
}

export function findBestKbMatch(predictedLabel: string): {
  entry: KnowledgeBaseEntry
  matchedAlias: string | null
  score: number
} {
  const normalized = normalizeLabel(predictedLabel)
  let best: { entry: KnowledgeBaseEntry; matchedAlias: string | null; score: number } | null = null

  for (const entry of RECOMMENDATION_KB) {
    for (const alias of entry.labelAliases) {
      const a = normalizeLabel(alias)
      if (!a) continue
      if (normalized === a) {
        const candidate = { entry, matchedAlias: alias, score: 1 }
        if (!best || candidate.score > best.score) best = candidate
        continue
      }
      if (normalized.includes(a)) {
        const candidate = { entry, matchedAlias: alias, score: Math.min(0.9, a.length / Math.max(1, normalized.length)) }
        if (!best || candidate.score > best.score) best = candidate
      }
    }
  }

  if (best) return best

  // Fallback: generic disease entry
  const generic = RECOMMENDATION_KB.find((e) => e.id === "kb-generic-disease") || RECOMMENDATION_KB[0]
  return { entry: generic, matchedAlias: null, score: 0 }
}


