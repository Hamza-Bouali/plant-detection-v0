import { Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { type ClassificationResult } from "@/lib/api"

interface ClassificationPanelProps {
  result: ClassificationResult | null
}

export function ClassificationPanel({ result }: ClassificationPanelProps) {
  if (!result) return null

  // Convert top_3 predictions to chart data format
  const confidenceData = result.top_3.map((pred, index) => ({
    name: pred.label.replace(/_/g, " "),
    value: Math.round(pred.score * 100),
    color: index === 0 ? "var(--color-primary)" : "var(--color-muted)",
  }))

  const confidencePercent = Math.round(result.top_3[0]?.score * 100 || 0)
  const predictedClassName = result.predicted_label.replace(/_/g, " ")
  const isHealthy = result.predicted_label.toLowerCase().includes("healthy")

  return (
    <Card className="md:col-span-1 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Classification (V1)
        </CardTitle>
        <CardDescription>Disease identification and confidence scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-6 rounded-2xl border border-border/50 text-center">
          <Badge 
            variant="outline" 
            className={`mb-2 px-3 py-1 ${
              isHealthy 
                ? "bg-green-500/10 text-green-600 border-green-500/20" 
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {isHealthy ? "Healthy" : "Disease Detected"}
          </Badge>
          <h3 className="text-3xl font-black text-foreground">{predictedClassName}</h3>
          {result.summary && (
            <p className="mt-2 text-sm text-muted-foreground">{result.summary}</p>
          )}
        <div className="mt-4 flex flex-col items-center">
            <span className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</span>
            <div className={`text-5xl font-black ${isHealthy ? "text-green-600" : "text-primary"}`}>
              {confidencePercent}<span className="text-2xl">%</span>
            </div>
          </div>
        </div>

        {confidenceData.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Top Predicted Classes</h4>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Confidence"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
