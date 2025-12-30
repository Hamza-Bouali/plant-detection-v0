"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, Camera, Activity, Maximize2, X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface AnalysisPanelProps {
  analyzed: boolean
  isAnalyzing: boolean
  startAnalysis: (imageBase64: string) => void
  error: string | null
}

export function AnalysisPanel({ analyzed, isAnalyzing, startAnalysis, error }: AnalysisPanelProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const clearImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const hasImage = uploadedImage !== null

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-xl overflow-hidden">
        <div className="h-2 bg-primary w-full opacity-50" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Image Upload & Analysis
          </CardTitle>
          <CardDescription>Initiate leaf analysis for disease detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => !hasImage && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-all ${
              isDragging 
                ? "border-primary bg-primary/10" 
                : hasImage 
                  ? "border-primary/20 bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            }`}
          >
            {!hasImage ? (
              <>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {isDragging ? "Drop image here" : "Drop leaf image here"}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to browse from device</p>
                </div>
              </>
            ) : (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={uploadedImage}
                  alt="Uploaded leaf"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearImage()
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <Button variant="secondary" size="sm" className="gap-2 pointer-events-auto">
                    <Maximize2 className="w-4 h-4" /> View Original
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button
              className="w-full py-6 text-base font-bold shadow-lg shadow-primary/20"
              disabled={isAnalyzing || !hasImage}
              onClick={() => uploadedImage && startAnalysis(uploadedImage)}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <Activity className="w-5 h-5 animate-spin" /> Classifying Disease...
                </span>
              ) : analyzed ? (
                "Re-analyze Image"
              ) : (
                "Launch Analysis Pipeline"
              )}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-primary">Running Segmentation (V2)...</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
