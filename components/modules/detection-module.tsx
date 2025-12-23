"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ImagePreview from "@/components/image-preview"

interface DetectionResult {
  watermarkDetected: boolean
  confidence: number
  watermarkText?: string
  method: "LSB" | "DCT"
}

export default function DetectionModule() {
  const [image, setImage] = useState<string | null>(null)
  const [results, setResults] = useState<DetectionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setResults([])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDetectLSB = async () => {
    if (!image) {
      alert("Téléchargez une image d'abord")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("imageData", image)

      const response = await fetch("/api/watermark/detect/lsb", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setResults((prev) => [
          ...prev,
          {
            watermarkDetected: data.detected,
            confidence: data.confidence,
            watermarkText: data.watermark,
            method: "LSB",
          },
        ])
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la détection LSB")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDetectDCT = async () => {
    if (!image) {
      alert("Téléchargez une image d'abord")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("imageData", image)

      const response = await fetch("/api/watermark/detect/dct", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setResults((prev) => [
          ...prev,
          {
            watermarkDetected: data.detected,
            confidence: data.confidence,
            watermarkText: data.watermark,
            method: "DCT",
          },
        ])
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la détection DCT")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Détection du Watermark</CardTitle>
          <CardDescription>Détectez et extrayez les watermarks LSB et DCT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm border border-border rounded-lg p-2 bg-background"
                />
                {image && <ImagePreview src={image || "/placeholder.svg"} alt="Image chargée" />}
              </CardContent>
            </Card>

            {/* Detection Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleDetectLSB} disabled={isProcessing || !image} className="w-full">
                  Détecter LSB
                </Button>
                <Button
                  onClick={handleDetectDCT}
                  disabled={isProcessing || !image}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  Détecter DCT
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">Résultats de Détection</h3>
              {results.map((result, idx) => (
                <Card key={idx} className={result.watermarkDetected ? "border-accent" : "border-muted"}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {result.watermarkDetected ? "✓" : "✗"} {result.method} Watermark
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Détecté:</p>
                      <p className="font-semibold">{result.watermarkDetected ? "Oui" : "Non"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confiance:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    {result.watermarkText && (
                      <div>
                        <p className="text-sm text-muted-foreground">Watermark:</p>
                        <p className="font-semibold">{result.watermarkText}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
