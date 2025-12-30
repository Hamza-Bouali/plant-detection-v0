"use client"

import { useEffect, useMemo, useState } from "react"
import { Zap, CheckCircle2, FileText, ChevronRight, Leaf, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { type ClassificationResult, type SegmentationResult } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"

type RecommendationPriority = "Low" | "Moderate" | "Urgent" | "Critical"

type AgentRecommendation = {
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
  error?: string
}

interface RecommendationPanelProps {
  classification: ClassificationResult | null
  segmentation: SegmentationResult | null
}

export function RecommendationPanel({ classification, segmentation }: RecommendationPanelProps) {
  if (!classification) return null

  const [agent, setAgent] = useState<AgentRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)

  const predictedClassName = classification.predicted_label.replace(/_/g, " ")

  const top1 = classification.top_3?.[0]?.score ?? 0
  const uiConfidence = Math.max(0, Math.min(1, top1))
  const confidencePercent = Math.round(uiConfidence * 100)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setAgentError(null)
      try {
        const sev = segmentation?.severity?.severity_score
        const cat = segmentation?.category?.label
        const notes =
          typeof sev === "number" || typeof cat === "string"
            ? `Segmentation severity_score=${typeof sev === "number" ? sev.toFixed(2) : "n/a"}, category=${cat || "n/a"}`
            : undefined

        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classification,
            language: "en",
            notes,
          }),
          signal: controller.signal,
        })
        const json = (await res.json()) as AgentRecommendation
        if (cancelled) return
        setAgent(json)
        if ((json as any)?.error) {
          setAgentError(String((json as any).error))
        }
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.name === "AbortError") return
        setAgent(null)
        setAgentError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [classification, segmentation])

  const isHealthy = useMemo(() => {
    const label = (classification.predicted_label || "").toLowerCase()
    return label.includes("healthy") || label.includes("normal")
  }, [classification.predicted_label])

  const severityScore = segmentation?.severity?.severity_score ?? 0

  const severityData = segmentation
    ? [
        { name: "Surface", value: Math.round(segmentation.severity.Ssurf * 100), color: "#3b82f6" },
        { name: "Density", value: Math.round(segmentation.severity.Sdens * 100), color: "#8b5cf6" },
        { name: "Gravity", value: Math.round(segmentation.severity.Sgrav * 100), color: "#f59e0b" },
        { name: "Dispersion", value: Math.round(segmentation.severity.Sdisp * 100), color: "#ef4444" },
      ]
    : []

  const priorityColors: Record<RecommendationPriority, string> = {
    Low: "bg-green-500 text-white",
    Moderate: "bg-yellow-500 text-black",
    Urgent: "bg-orange-500 text-white",
    Critical: "bg-destructive text-destructive-foreground",
  }

  const severityPriority: RecommendationPriority = (() => {
    if (isHealthy) return "Low"
    if (!segmentation) return "Moderate"
    if (severityScore < 25) return "Moderate"
    if (severityScore < 50) return "Urgent"
    if (severityScore < 75) return "Urgent"
    return "Critical"
  })()

  const rank: Record<RecommendationPriority, number> = { Low: 0, Moderate: 1, Urgent: 2, Critical: 3 }
  const priority: RecommendationPriority =
    agent?.priority && rank[agent.priority] > rank[severityPriority] ? agent.priority : severityPriority

  const headerSummary =
    agent?.summary ||
    (isHealthy
      ? "Your plant appears healthy. Keep monitoring and maintain good agronomic practices."
      : "A disease/stress pattern is suspected. Generate recommendations to get action steps grounded in the knowledge base.")

  const primaryAction =
    agent?.immediateActions?.[0] ||
    (isHealthy ? "Continue regular maintenance" : "Scout the field and isolate affected plants")

  return (
    <Card className={`md:col-span-2 border-primary/20 ${isHealthy ? "bg-green-500/[0.02]" : "bg-primary/[0.02]"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            AI Agronomic Recommendations
          </CardTitle>
          <CardDescription>Automated decision support for {predictedClassName}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Badge variant="secondary" className="font-bold px-3 py-1 gap-2">
              <Spinner className="size-4" /> Generating
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-bold px-3 py-1">
              {agent?.mode === "openai" ? "OpenAI" : "KB Fallback"}
            </Badge>
          )}
          <Badge className={`font-bold px-4 py-1 ${priorityColors[priority]}`}>Priority: {priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isHealthy ? "bg-green-500/20" : priority === "Critical" ? "bg-red-500/20" : "bg-primary/20"
            }`}>
              {isHealthy ? (
                <Leaf className="w-6 h-6 text-green-600" />
              ) : priority === "Critical" ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold">Recommended Action: {primaryAction}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {segmentation && !isHealthy && (
                  <span className="block mt-2 text-foreground font-medium">
                    Severity Score: {Math.round(segmentation.severity.severity_score)}/100
                    ({segmentation.category.label})
                  </span>
                )}
                {headerSummary}
              </p>
              {agentError && (
                <div className="flex items-start gap-2 text-sm text-destructive pt-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{agentError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-16">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Monitoring Plan</h5>
              <p className="text-sm">{agent?.monitoringPlan || "Re-check symptoms in 48–72 hours and monitor spread."}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Knowledge Base Match</h5>
              <p className="text-sm">
                {agent?.kb?.name || "General guidance"}{" "}
                {agent?.kb ? (
                  <span className="text-muted-foreground">
                    (match {(agent.kb.matchScore * 100).toFixed(0)}%{agent.kb.matchedAlias ? ` via “${agent.kb.matchedAlias}”` : ""})
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {agent?.immediateActions?.length ? (
            <div className="ml-16 space-y-3">
              <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Immediate Actions</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {agent.immediateActions.slice(0, 6).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 lg:border-l lg:border-border lg:pl-8">
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
            {segmentation ? "Severity Breakdown" : "Confidence"}
          </h4>
          {segmentation ? (
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={70} 
                    axisLine={false} 
                    tickLine={false}
                    style={{ fontSize: "11px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px]">
              <div className="text-center">
                <p className={`text-5xl font-black ${isHealthy ? "text-green-500" : "text-primary"}`}>
                  {confidencePercent}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Classification Confidence</p>
              </div>
            </div>
          )}
          <div className="pt-2">
            <Button variant="secondary" className="w-full gap-2 text-sm font-bold">
              <FileText className="w-4 h-4" /> Generate Report
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
