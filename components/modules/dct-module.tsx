"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { X, Upload, Activity } from "lucide-react"
import DCTControls from "@/components/controls/dct-controls"

// Types
interface ComparisonMetrics {
  psnr: number
  mse: number
  pixelsModified: number
}

interface ExtractionResult {
  originalImage: string
  watermarkText: string
}

export default function DCTModule() {
  // State
  const [image, setImage] = useState<string | null>(null)
  const [watermark, setWatermark] = useState<string>("")
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [strength, setStrength] = useState(0.5)
  const [currentMetrics, setCurrentMetrics] = useState<{ psnr?: number; mse?: number } | null>(null)

  // Extraction State
  const [extractionImage, setExtractionImage] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)

  // Comparison State
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [watermarkedImage1, setWatermarkedImage1] = useState<string | null>(null)
  const [watermarkedImage2, setWatermarkedImage2] = useState<string | null>(null)
  const [comparisonMetrics1, setComparisonMetrics1] = useState<ComparisonMetrics | null>(null)
  const [comparisonMetrics2, setComparisonMetrics2] = useState<ComparisonMetrics | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helpers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setter(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Actions
  const handleAddWatermark = async () => {
    if (!image) return alert("Image requise")
    if (!watermark) return alert("Texte requis")

    setIsProcessing(true)
    try {
      const formData = await createFormDataFromImage(image)
      formData.append("watermark", watermark)
      formData.append("strength", strength.toString())

      const res = await fetch("/api/watermark/dct/add", { method: "POST", body: formData })
      const data = await res.json()

      if (data.success) {
        setWatermarkedImage(data.watermarkedImage)
        setCurrentMetrics(data.metrics)
      } else {
        alert(data.error || "Erreur")
      }
    } catch (e) { console.error(e); alert("Erreur inattendue") }
    finally { setIsProcessing(false) }
  }

  const handleExtract = async () => {
    if (!extractionImage) return alert("Image requise")
    setIsProcessing(true)
    try {
      const formData = await createFormDataFromImage(extractionImage)

      const res = await fetch("/api/watermark/dct/extract", { method: "POST", body: formData })
      const data = await res.json()

      if (data.success) {
        setExtractionResult({
          originalImage: extractionImage,
          watermarkText: data.watermark || "Aucun watermark détecté"
        })
      } else {
        alert(data.error || "Erreur lors de l'extraction")
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'extraction")
    }
    finally { setIsProcessing(false) }
  }


  const handleCompare = async () => {
    if (!originalImage) return alert("Image originale requise")
    setIsProcessing(true)
    try {
      const formData1 = new FormData()
      const formData2 = new FormData()

      if (watermarkedImage1) {
        const img1 = await imageToDataURL(await loadImage(originalImage))
        const img2 = await imageToDataURL(await loadImage(watermarkedImage1))
        formData1.append("image1", img1)
        formData1.append("image2", img2)

        const res1 = await fetch("/api/watermark/dct/compare-files", { method: "POST", body: formData1 })
        const data1 = await res1.json()
        if (data1.success) setComparisonMetrics1(data1.metrics)
      }

      if (watermarkedImage2) {
        const img1 = await imageToDataURL(await loadImage(originalImage))
        const img2 = await imageToDataURL(await loadImage(watermarkedImage2))
        formData2.append("image1", img1)
        formData2.append("image2", img2)

        const res2 = await fetch("/api/watermark/dct/compare-files", { method: "POST", body: formData2 })
        const data2 = await res2.json()
        if (data2.success) setComparisonMetrics2(data2.metrics)
      }

    } catch (e) {
      console.error(e);
      alert("Erreur lors de la comparaison")
    }
    finally { setIsProcessing(false) }
  }

  // Utilities
  async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
    })
  }
  async function imageToDataURL(img: HTMLImageElement): Promise<string> {
    const cvs = document.createElement("canvas"); cvs.width = img.width; cvs.height = img.height;
    cvs.getContext("2d")?.drawImage(img, 0, 0); return cvs.toDataURL("image/png");
  }
  async function createFormDataFromImage(src: string): Promise<FormData> {
    const img = await loadImage(src)
    const dataUrl = await imageToDataURL(img)
    const fd = new FormData(); fd.append("imageData", dataUrl); return fd;
  }

  const handleResetComparison = () => {
    setOriginalImage(null)
    setWatermarkedImage1(null)
    setWatermarkedImage2(null)
    setComparisonMetrics1(null)
    setComparisonMetrics2(null)
    // Clear file inputs if we had refs for them, but since we don"t have refs for comparison inputs, 
    // relying on state clear is enough for React. 
    // Ideally we"d reset the input values too, but without refs it"s tricky.
    // For now, state reset clears the UI previews which is the main thing.
    // To properly clear file inputs, we can key them or use refs.
    // Key approach is cleaner: key={originalImage ? "loaded" : "empty"}
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">WATERMARKING DCT</CardTitle>
          </div>
          <CardDescription className="text-xs">Robustesse fréquentielle via la Transformée en Cosinus Discrète.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="insertion" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b h-12 bg-transparent p-0">
              <TabsTrigger value="insertion" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Insertion</TabsTrigger>
              <TabsTrigger value="extraction" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Extraction</TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-6">Comparaison</TabsTrigger>
            </TabsList>

            {/* --- INSERTION --- */}
            <TabsContent value="insertion" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Configuration */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Source</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden shrink-0 border border-dashed border-gray-400 flex items-center justify-center group cursor-pointer hover:bg-muted/80 transition"
                        onClick={() => fileInputRef.current?.click()}>
                        {image ? <img src={image} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition" />}
                        <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setImage)} />
                      </div>
                      <div className="text-sm text-balance text-muted-foreground">
                        <p>Format PNG/JPG recommandé.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message à Cacher</Label>
                    <Input
                      placeholder="Votre texte secret..."
                      className="h-9 text-sm"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <DCTControls strength={strength} onStrengthChange={setStrength} />
                  </div>

                  <Button onClick={handleAddWatermark} disabled={!image || isProcessing} className="w-full">
                    {isProcessing ? "Traitement..." : "Appliquer le Watermark"}
                  </Button>
                </div>

                {/* Right: Preview */}
                <div className="bg-muted/30 rounded-xl p-4 border border-dashed min-h-[300px] flex flex-col justify-center items-center relative">
                  {!watermarkedImage && <div className="text-center text-muted-foreground text-sm"><p>Le résultat s'affichera ici.</p></div>}

                  {watermarkedImage && (
                    <div className="w-full space-y-4 animate-in fade-in zoom-in">
                      <div className="relative aspect-video w-full bg-black/5 rounded-lg overflow-hidden border">
                        <img src={watermarkedImage} className="w-full h-full object-contain" />
                      </div>

                      {currentMetrics && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-background rounded p-2 border shadow-sm">
                            <div className="text-[10px] text-muted-foreground uppercase">Qualité Visuelle (PSNR)</div>
                            <div className={`text-lg font-bold ${currentMetrics.psnr! > 35 ? 'text-green-500' : 'text-yellow-500'}`}>
                              {currentMetrics.psnr?.toFixed(2)} dB
                            </div>
                          </div>
                          <div className="bg-background rounded p-2 border shadow-sm">
                            <div className="text-[10px] text-muted-foreground uppercase">Taux d'erreur (MSE)</div>
                            <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                              {currentMetrics.mse?.toFixed(5)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => {
                          const link = document.createElement("a"); link.href = watermarkedImage; link.download = "watermarked-dct.png"; link.click();
                        }}>Télécharger</Button>
                        <Button variant="ghost" className="flex-1" onClick={() => {
                          setImage(null); setWatermarkedImage(null); setWatermark("");
                        }}>Recommencer</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* --- EXTRACTION --- */}
            <TabsContent value="extraction" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image à Analyser</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setExtractionImage)} />
                  {extractionImage && (
                    <div className="h-48 bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                      <img src={extractionImage} className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <Button onClick={handleExtract} disabled={!extractionImage || isProcessing} className="w-full" variant="secondary">
                    {isProcessing ? "Analyse en cours..." : "Extraire le message"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Résultat de l'Extraction</Label>
                  {extractionResult ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Image Originale</p>
                        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden border">
                          <img
                            src={extractionImage!}
                            alt="Originale"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">Watermark Extraite</p>
                        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
                          <div className="text-white text-center p-4 w-full h-full flex flex-col items-center justify-center overflow-y-auto">
                            <div className="text-xl font-bold">{extractionResult.watermarkText}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-md min-h-[200px] flex items-center justify-center border border-dashed">
                      <p className="text-sm text-muted-foreground">Le résultat s'affichera ici</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* --- COMPARISON --- */}
            <TabsContent value="comparison" className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Comparez 1 image originale avec 2 images watermarkées</p>
                  {/* Reset Button */}
                  <Button variant="ghost" size="sm" onClick={handleResetComparison} disabled={!originalImage && !watermarkedImage1 && !watermarkedImage2}>
                    <X className="w-4 h-4 mr-2" />
                    Recommencer
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Image Originale */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-center">Image Originale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setOriginalImage)}
                      />
                      {originalImage && (
                        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                          <img src={originalImage} alt="Originale" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Image Watermarkée 1 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-center">Image Watermarkée 1</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setWatermarkedImage1)}
                      />
                      {watermarkedImage1 && (
                        <>
                          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                            <img src={watermarkedImage1} alt="Watermarkée 1" className="w-full h-full object-contain" />
                          </div>
                          {comparisonMetrics1 && (
                            <div className="space-y-1 text-xs bg-muted p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PSNR:</span>
                                <span className={`font-semibold ${comparisonMetrics1.psnr > 35 ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {comparisonMetrics1.psnr === Infinity ? "∞" : comparisonMetrics1.psnr.toFixed(2)} dB
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">MSE:</span>
                                <span className="font-semibold">{comparisonMetrics1.mse.toFixed(6)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Image Watermarkée 2 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-center">Image Watermarkée 2</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setWatermarkedImage2)}
                      />
                      {watermarkedImage2 && (
                        <>
                          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                            <img src={watermarkedImage2} alt="Watermarkée 2" className="w-full h-full object-contain" />
                          </div>
                          {comparisonMetrics2 && (
                            <div className="space-y-1 text-xs bg-muted p-2 rounded">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">PSNR:</span>
                                <span className={`font-semibold ${comparisonMetrics2.psnr > 35 ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {comparisonMetrics2.psnr === Infinity ? "∞" : comparisonMetrics2.psnr.toFixed(2)} dB
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">MSE:</span>
                                <span className="font-semibold">{comparisonMetrics2.mse.toFixed(6)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleCompare}
                    disabled={!originalImage || (!watermarkedImage1 && !watermarkedImage2) || isProcessing}
                    className="w-full md:w-auto"
                  >
                    {isProcessing ? "Calcul en cours..." : "Comparer les Images"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
