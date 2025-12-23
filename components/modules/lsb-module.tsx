"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImagePreview from "@/components/image-preview"
import LSBControls from "@/components/controls/lsb-controls"

export default function LSBModule() {
  const [image, setImage] = useState<string | null>(null)
  const [watermark, setWatermark] = useState<string>("")
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lsbBits, setLsbBits] = useState(1)
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
        formData.append("lsbBits", lsbBits.toString())

        const response = await fetch("/api/watermark/lsb/add", {
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
      formData.append("lsbBits", lsbBits.toString())

      const response = await fetch("/api/watermark/lsb/extract", {
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
          <CardTitle>LSB (Least Significant Bit) Watermarking</CardTitle>
          <CardDescription>
            Modifiez les bits les moins significatifs pour insérer un watermark invisible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theory" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="theory">Théorie</TabsTrigger>
              <TabsTrigger value="practice">Pratique</TabsTrigger>
            </TabsList>

            <TabsContent value="theory" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Comment fonctionne LSB?</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
                  <li>Modifie les bits les moins significatifs des pixels</li>
                  <li>Chaque pixel a une valeur RGB (0-255) codée en 8 bits</li>
                  <li>Le bit LSB change la valeur du pixel de moins de 1%</li>
                  <li>Invisible à l'oeil humain mais détectable par analyse</li>
                  <li>Peu robuste aux compressions et transformations</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Avantages</h3>
                <p className="text-sm">Simple, rapide, grande capacité d'insertion</p>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-primary">Inconvénients</h3>
                <p className="text-sm">Sensible à la compression, faible robustesse aux attaques</p>
              </div>
            </TabsContent>

            <TabsContent value="practice" className="space-y-4 mt-4">
              <LSBControls lsbBits={lsbBits} onLsbBitsChange={setLsbBits} />

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
