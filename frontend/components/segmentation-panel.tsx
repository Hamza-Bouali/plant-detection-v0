import { Maximize2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SegmentationPanel() {
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
        <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
          <img
            src="/placeholder.svg?height=300&width=500"
            alt="Segmentation mask"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-black/60 backdrop-blur-md">Segmentation Overlay</Badge>
            <Badge className="bg-destructive/80 backdrop-blur-md">7 Lesions Detected</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Infected Surface</p>
            <p className="text-2xl font-black mt-1">24.8%</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase">Severity Score</p>
            <p className="text-2xl font-black mt-1 text-orange-500">68/100</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Risk Category</h4>
            <span className="text-lg font-bold text-orange-500">High Risk</span>
          </div>
          <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500/20 w-1/4 border-r border-background/20" title="Negligible" />
            <div className="h-full bg-yellow-500/20 w-1/4 border-r border-background/20" title="Moderate" />
            <div className="h-full bg-orange-500 w-1/4 border-r border-background/20" title="High" />
            <div className="h-full bg-red-500/20 w-1/4" title="Critical" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
