"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ImagePreview from "@/components/image-preview"
import AttackControls from "@/components/controls/attack-controls"

export default function AttackTestModule() {
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null)
  const [attackedImages, setAttackedImages] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAttack, setSelectedAttack] = useState<"compression" | "blur" | "rotation" | "noise">("compression")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setWatermarkedImage(event.target?.result as string)
        setAttackedImages({})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleApplyAttack = async (attack: string, params: any) => {
    if (!watermarkedImage) {
      alert("Téléchargez une image watermarkée d'abord")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("imageData", watermarkedImage)
      formData.append("attackType", attack)
      Object.keys(params).forEach((key) => {
        formData.append(key, params[key].toString())
      })

      const response = await fetch("/api/watermark/attack", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setAttackedImages((prev) => ({
          ...prev,
          [attack]: data.attackedImage,
        }))
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'attaque")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tests d'Attaques</CardTitle>
          <CardDescription>Testez la robustesse de vos watermarks contre différentes attaques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Téléchargez une image watermarkée</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm border border-border rounded-lg p-2 bg-background"
            />
            {watermarkedImage && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Image chargée:</p>
                <ImagePreview src={watermarkedImage || "/placeholder.svg"} alt="Image watermarkée" />
              </div>
            )}
          </div>

          {/* Attacks */}
          {watermarkedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compression JPEG */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1. Compression JPEG</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AttackControls
                    attackType="compression"
                    onApply={(params) => handleApplyAttack("compression", params)}
                    isProcessing={isProcessing}
                  />
                  {attackedImages["compression"] && (
                    <ImagePreview src={attackedImages["compression"] || "/placeholder.svg"} alt="Compression" />
                  )}
                </CardContent>
              </Card>

              {/* Blur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2. Flou Gaussien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AttackControls
                    attackType="blur"
                    onApply={(params) => handleApplyAttack("blur", params)}
                    isProcessing={isProcessing}
                  />
                  {attackedImages["blur"] && (
                    <ImagePreview src={attackedImages["blur"] || "/placeholder.svg"} alt="Blur" />
                  )}
                </CardContent>
              </Card>

              {/* Rotation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3. Rotation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AttackControls
                    attackType="rotation"
                    onApply={(params) => handleApplyAttack("rotation", params)}
                    isProcessing={isProcessing}
                  />
                  {attackedImages["rotation"] && (
                    <ImagePreview src={attackedImages["rotation"] || "/placeholder.svg"} alt="Rotation" />
                  )}
                </CardContent>
              </Card>

              {/* Noise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">4. Bruit Gaussien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AttackControls
                    attackType="noise"
                    onApply={(params) => handleApplyAttack("noise", params)}
                    isProcessing={isProcessing}
                  />
                  {attackedImages["noise"] && (
                    <ImagePreview src={attackedImages["noise"] || "/placeholder.svg"} alt="Noise" />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Theory */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">Types d'Attaques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">Compression JPEG</p>
                <p>Élimine les données à haute fréquence, test majeur de robustesse</p>
              </div>
              <div>
                <p className="font-semibold">Flou Gaussien</p>
                <p>Lisse l'image, affecte surtout les watermarks spatiaux (LSB)</p>
              </div>
              <div>
                <p className="font-semibold">Rotation</p>
                <p>Change l'orientation, détruit l'alignement des blocs DCT</p>
              </div>
              <div>
                <p className="font-semibold">Bruit Gaussien</p>
                <p>Ajoute du bruit aléatoire, dégrade le watermark</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
