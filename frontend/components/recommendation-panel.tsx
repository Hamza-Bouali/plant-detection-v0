import { Zap, CheckCircle2, FileText, ChevronRight, Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { type ClassificationResult } from "@/lib/api"

// Disease-specific recommendations database
const diseaseRecommendations: Record<string, {
  action: string
  description: string
  followUp: string
  riskFactors: string
  priority: "Low" | "Moderate" | "Urgent" | "Critical"
}> = {
  default_disease: {
    action: "Consult Agricultural Expert",
    description: "A plant disease has been detected. Please consult with a local agricultural extension service for specific treatment recommendations based on your crop type and local conditions.",
    followUp: "Monitor the affected plants daily for progression.",
    riskFactors: "Environmental stress and poor growing conditions may accelerate disease spread.",
    priority: "Moderate",
  },
  healthy: {
    action: "Continue Regular Maintenance",
    description: "Your plant appears healthy! Continue with regular watering, fertilization, and monitoring schedules. Maintain good agricultural practices to prevent future disease outbreaks.",
    followUp: "Routine inspection every 7-14 days.",
    riskFactors: "Seasonal changes may increase disease susceptibility.",
    priority: "Low",
  },
}

interface RecommendationPanelProps {
  result: ClassificationResult | null
}

export function RecommendationPanel({ result }: RecommendationPanelProps) {
  if (!result) return null

  const isHealthy = result.predicted_label.toLowerCase().includes("healthy")
  const recommendation = isHealthy 
    ? diseaseRecommendations.healthy 
    : diseaseRecommendations.default_disease

  const confidencePercent = Math.round(result.top_3[0]?.score * 100 || 0)
  const predictedClassName = result.predicted_label.replace(/_/g, " ")

  // Generate mock severity data based on confidence
  const severityHistory = [
    { date: "Day 1", score: Math.round(confidencePercent * 0.3) },
    { date: "Day 3", score: Math.round(confidencePercent * 0.5) },
    { date: "Day 5", score: Math.round(confidencePercent * 0.7) },
    { date: "Day 7", score: Math.round(confidencePercent * 0.85) },
    { date: "Today", score: confidencePercent },
  ]

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
        <Badge className={`font-bold px-4 py-1 ${priorityColors[recommendation.priority]}`}>
          Priority: {recommendation.priority}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isHealthy ? "bg-green-500/20" : "bg-primary/20"
            }`}>
              {isHealthy ? (
                <Leaf className="w-6 h-6 text-green-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold">Recommended Action: {recommendation.action}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {recommendation.description}
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
          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Confidence Trend</h4>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={severityHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "var(--color-primary)" }}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={isHealthy ? "var(--color-green-500)" : "var(--color-primary)"}
                  strokeWidth={3}
                  dot={{ fill: isHealthy ? "var(--color-green-500)" : "var(--color-primary)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
