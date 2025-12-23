"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImagePreview from "@/components/image-preview"
import DCTControls from "@/components/controls/dct-controls"

export default function DCTModule() {
  const [image, setImage] = useState<string | null>(null)
  const [watermark, setWatermark] = useState<string>("")
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [strength, setStrength] = useState(0.5)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setWatermarkedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddWatermark = async () => {
    if (!image || !watermark) {
      alert("Veuillez télécharger une image et entrer un texte de watermark")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      const canvas = document.createElement("canvas")
      const img = new Image()
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0)

        formData.append("imageData", canvas.toDataURL("image/png"))
        formData.append("watermark", watermark)
        formData.append("strength", strength.toString())

        const response = await fetch("/api/watermark/dct/add", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()
        if (data.success) {
          setWatermarkedImage(data.watermarkedImage)
        }
      }
      img.src = image
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors du watermarking")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtractWatermark = async () => {
    if (!watermarkedImage) {
      alert("Aucune image watermarkée trouvée")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("imageData", watermarkedImage)

      const response = await fetch("/api/watermark/dct/extract", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        alert(`Watermark extrait: ${data.watermark}`)
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'extraction")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DCT (Discrete Cosine Transform) Watermarking</CardTitle>
          <CardDescription>Modifiez les coefficients DCT pour un watermark plus robuste</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theory" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="theory">Théorie</TabsTrigger>
              <TabsTrigger value="practice">Pratique</TabsTrigger>
            </TabsList>

            <TabsContent value="theory" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Comment fonctionne DCT?</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
                  <li>Transforme l'image en domaine fréquentiel</li>
                  <li>Divide l'image en blocs 8x8</li>
                  <li>Applique la DCT à chaque bloc</li>
                  <li>Modifie les coefficients moyens (mid-frequency)</li>
                  <li>Offre meilleure robustesse qu'LSB</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Avantages</h3>
                <p className="text-sm">Robuste à la compression JPEG, plus résistant aux attaques</p>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Inconvénients</h3>
                <p className="text-sm">Plus complexe, plus lent, capacité inférieure à LSB</p>
              </div>
            </TabsContent>

            <TabsContent value="practice" className="space-y-4 mt-4">
              <DCTControls strength={strength} onStrengthChange={setStrength} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Upload Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1. Image Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} />
                    {image && <ImagePreview src={image || "/placeholder.svg"} alt="Image source" />}
                  </CardContent>
                </Card>

                {/* Watermark Text */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Watermark</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Entrez le texte du watermark"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                      maxLength={50}
                    />
                    <Button
                      onClick={handleAddWatermark}
                      disabled={isProcessing || !image || !watermark}
                      className="w-full"
                    >
                      {isProcessing ? "Traitement..." : "Ajouter Watermark"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Result */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">3. Résultat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {watermarkedImage && (
                      <>
                        <ImagePreview src={watermarkedImage || "/placeholder.svg"} alt="Image watermarkée" />
                        <Button onClick={handleExtractWatermark} variant="outline" className="w-full bg-transparent">
                          Extraire Watermark
                        </Button>
                      </>
                    )}
                    {!watermarkedImage && (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        L'image watermarkée apparaîtra ici
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
