"use client"

import { useState, Suspense } from "react"
import { AlertTriangle, FileText, Zap, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { DashboardHeader } from "@/components/dashboard-header"
import { AnalysisPanel } from "@/components/analysis-panel"
import { ClassificationPanel } from "@/components/classification-panel"
import { SegmentationPanel } from "@/components/segmentation-panel"
import { RecommendationPanel } from "@/components/recommendation-panel"
import { 
  classifyImageBase64, 
  segmentImageBase64,
  type ClassificationResult, 
  type SegmentationResult 
} from "@/lib/api"

export interface AnalysisResult {
  classification: ClassificationResult | null
  segmentation: SegmentationResult | null
  error: string | null
}

function DashboardContent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    classification: null,
    segmentation: null,
    error: null,
  })

  const startAnalysis = async (imageBase64: string) => {
    setIsAnalyzing(true)
    setAnalysisResult({ classification: null, segmentation: null, error: null })

    try {
      // Run both APIs in parallel
      const [classificationResult, segmentationResult] = await Promise.all([
        classifyImageBase64(imageBase64),
        segmentImageBase64(imageBase64),
      ])
      
      setAnalysisResult({ 
        classification: classificationResult, 
        segmentation: segmentationResult,
        error: null 
      })
      setAnalyzed(true)
    } catch (error) {
      setAnalysisResult({ 
        classification: null, 
        segmentation: null,
        error: error instanceof Error ? error.message : "Analysis failed" 
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="xl:col-span-4 space-y-6">
          <AnalysisPanel 
            analyzed={analyzed} 
            isAnalyzing={isAnalyzing} 
            startAnalysis={startAnalysis}
            error={analysisResult.error}
          />

          {analyzed && analysisResult.classification && (
            <Card className={`border-primary/20 ${
              (analysisResult.classification.top_3[0]?.score || 0) > 0.7 
                ? "bg-destructive/5 border-destructive/20" 
                : "bg-primary/5"
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest text-primary">
                  <Zap className="w-4 h-4" /> Quick Decision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {(analysisResult.classification.top_3[0]?.score || 0) > 0.7 ? "Urgent Intervention" : "Monitor Closely"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysisResult.classification.predicted_label.replace(/_/g, " ")} detected with{" "}
                      {((analysisResult.classification.top_3[0]?.score || 0) * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                  {(analysisResult.classification.top_3[0]?.score || 0) > 0.7 ? (
                    <AlertTriangle className="w-12 h-12 text-destructive animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content Area */}
        <div className="xl:col-span-8 space-y-6">
          {!analyzed ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl opacity-50 p-20 text-center">
              <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold">No Analysis Results</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Upload a leaf image and launch the pipeline to see AI-driven disease classification, severity analysis,
                and actionable recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClassificationPanel result={analysisResult.classification} />
              <SegmentationPanel result={analysisResult.segmentation} />
              <RecommendationPanel 
                classification={analysisResult.classification} 
                segmentation={analysisResult.segmentation}
              />
            </div>
          )}
        </div>
      </main>

      {/* Status Bar */}
      <footer className="border-t border-border bg-card/30 py-3 px-6 text-xs text-muted-foreground">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Pipeline: Active
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Models: V1 (Loaded), V2 (Loaded)
            </span>
          </div>
          <div>Last Sync: Dec 30, 2025 - 14:42:05</div>
        </div>
      </footer>
    </div>
  )
}

export default function DSSDashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
