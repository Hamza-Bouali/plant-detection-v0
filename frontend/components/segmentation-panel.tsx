"use client"

import { useState } from "react"
import { Maximize2, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type SegmentationResult } from "@/lib/api"

interface SegmentationPanelProps {
  result: SegmentationResult | null
}

export function SegmentationPanel({ result }: SegmentationPanelProps) {
  if (!result) return null

  const severityScore = Math.round(result.severity.severity_score)
  const infectedSurface = ((1 - result.stats.veg_ratio) * 100).toFixed(1)
  const categoryLabel = result.category.label
  const categoryColor = result.category.color

  // Determine risk level based on severity score
  const getRiskLevel = (score: number) => {
    if (score < 25) return { level: "Low Risk", color: "text-green-500", segment: 0 }
    if (score < 50) return { level: "Moderate Risk", color: "text-yellow-500", segment: 1 }
    if (score < 75) return { level: "High Risk", color: "text-orange-500", segment: 2 }
    return { level: "Critical Risk", color: "text-red-500", segment: 3 }
  }

  const risk = getRiskLevel(severityScore)

  return (
    <Card className="md:col-span-1 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-primary" />
          Severity Analysis (V2+A1)
        </CardTitle>
        <CardDescription>Visual segmentation and spatial risk</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Severity Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Surface (Ssurf)</p>
            <p className="text-xl font-black mt-1">{(result.severity.Ssurf * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Density (Sdens)</p>
            <p className="text-xl font-black mt-1">{(result.severity.Sdens * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Gravity (Sgrav)</p>
            <p className="text-xl font-black mt-1">{(result.severity.Sgrav * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Dispersion (Sdisp)</p>
            <p className="text-xl font-black mt-1">{(result.severity.Sdisp * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Vegetation Ratio</p>
            <p className="text-2xl font-black mt-1">{(result.stats.veg_ratio * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Severity Score</p>
            <p className={`text-2xl font-black mt-1 ${risk.color}`}>{severityScore}/100</p>
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center justify-center">
          <Badge 
            className="px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: categoryColor, color: '#fff' }}
          >
            {categoryLabel}
          </Badge>
        </div>

        {/* Risk Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Risk Category</h4>
            <span className={`text-lg font-bold ${risk.color}`}>{risk.level}</span>
          </div>
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
            <div 
              className={`h-full w-1/4 border-r border-background/20 ${risk.segment === 0 ? "bg-green-500" : "bg-green-500/20"}`} 
              title="Low" 
            />
            <div 
              className={`h-full w-1/4 border-r border-background/20 ${risk.segment === 1 ? "bg-yellow-500" : "bg-yellow-500/20"}`} 
              title="Moderate" 
            />
            <div 
              className={`h-full w-1/4 border-r border-background/20 ${risk.segment === 2 ? "bg-orange-500" : "bg-orange-500/20"}`} 
              title="High" 
            />
            <div 
              className={`h-full w-1/4 ${risk.segment === 3 ? "bg-red-500" : "bg-red-500/20"}`} 
              title="Critical" 
            />
          </div>
        </div>

        {/* Segmentation Images */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Segmentation Visualization</h4>
          </div>
          {result.images ? (
            <Tabs defaultValue="overlay" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="mask">Mask</TabsTrigger>
                <TabsTrigger value="overlay">Overlay</TabsTrigger>
              </TabsList>
              <TabsContent value="original" className="mt-3">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                  <img 
                    src={result.images.original.startsWith('data:') ? result.images.original : `data:image/png;base64,${result.images.original}`}
                    alt="Original image"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </TabsContent>
              <TabsContent value="mask" className="mt-3">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                  <img 
                    src={result.images.mask.startsWith('data:') ? result.images.mask : `data:image/png;base64,${result.images.mask}`}
                    alt="Segmentation mask"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </TabsContent>
              <TabsContent value="overlay" className="mt-3">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                  <img 
                    src={result.images.overlay.startsWith('data:') ? result.images.overlay : `data:image/png;base64,${result.images.overlay}`}
                    alt="Overlay visualization"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-4 rounded-lg border border-border/50 bg-muted/20 text-center text-muted-foreground">
              <p>No visualization images available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
