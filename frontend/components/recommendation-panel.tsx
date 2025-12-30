import { Zap, CheckCircle2, FileText, ChevronRight, Leaf, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { type ClassificationResult, type SegmentationResult } from "@/lib/api"

// Disease-specific recommendations database
const diseaseRecommendations: Record<string, {
  action: string
  description: string
  followUp: string
  riskFactors: string
}> = {
  default_disease: {
    action: "Consult Agricultural Expert",
    description: "A plant disease has been detected. Please consult with a local agricultural extension service for specific treatment recommendations based on your crop type and local conditions.",
    followUp: "Monitor the affected plants daily for progression.",
    riskFactors: "Environmental stress and poor growing conditions may accelerate disease spread.",
  },
  healthy: {
    action: "Continue Regular Maintenance",
    description: "Your plant appears healthy! Continue with regular watering, fertilization, and monitoring schedules. Maintain good agricultural practices to prevent future disease outbreaks.",
    followUp: "Routine inspection every 7-14 days.",
    riskFactors: "Seasonal changes may increase disease susceptibility.",
  },
}

interface RecommendationPanelProps {
  classification: ClassificationResult | null
  segmentation: SegmentationResult | null
}

export function RecommendationPanel({ classification, segmentation }: RecommendationPanelProps) {
  if (!classification) return null

  const isHealthy = classification.predicted_label.toLowerCase().includes("healthy")
  const recommendation = isHealthy 
    ? diseaseRecommendations.healthy 
    : diseaseRecommendations.default_disease

  const confidencePercent = Math.round(classification.top_3[0]?.score * 100 || 0)
  const predictedClassName = classification.predicted_label.replace(/_/g, " ")
  
  // Determine priority based on severity score if available
  const severityScore = segmentation?.severity.severity_score || 0
  const getPriority = (): "Low" | "Moderate" | "Urgent" | "Critical" => {
    if (isHealthy) return "Low"
    if (severityScore < 25) return "Moderate"
    if (severityScore < 50) return "Urgent"
    if (severityScore < 75) return "Urgent"
    return "Critical"
  }
  const priority = getPriority()

  // Severity breakdown chart data
  const severityData = segmentation ? [
    { name: "Surface", value: Math.round(segmentation.severity.Ssurf * 100), color: "#3b82f6" },
    { name: "Density", value: Math.round(segmentation.severity.Sdens * 100), color: "#8b5cf6" },
    { name: "Gravity", value: Math.round(segmentation.severity.Sgrav * 100), color: "#f59e0b" },
    { name: "Dispersion", value: Math.round(segmentation.severity.Sdisp * 100), color: "#ef4444" },
  ] : []

  const priorityColors: Record<string, string> = {
    Low: "bg-green-500 text-white",
    Moderate: "bg-yellow-500 text-black",
    Urgent: "bg-orange-500 text-white",
    Critical: "bg-destructive text-destructive-foreground",
  }

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
        <Badge className={`font-bold px-4 py-1 ${priorityColors[priority]}`}>
          Priority: {priority}
        </Badge>
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
              <h4 className="text-lg font-bold">Recommended Action: {recommendation.action}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {recommendation.description}
                {segmentation && !isHealthy && (
                  <span className="block mt-2 text-foreground font-medium">
                    Severity Score: {Math.round(segmentation.severity.severity_score)}/100 
                    ({segmentation.category.label})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-16">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Follow-up</h5>
              <p className="text-sm">{recommendation.followUp}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h5 className="text-xs font-bold uppercase text-muted-foreground mb-1">Risk Factors</h5>
              <p className="text-sm">{recommendation.riskFactors}</p>
            </div>
          </div>
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
