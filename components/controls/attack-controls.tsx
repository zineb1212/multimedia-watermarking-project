"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"

interface AttackControlsProps {
  attackType: string
  onApply: (params: any) => void
  isProcessing: boolean
}

export default function AttackControls({ attackType, onApply, isProcessing }: AttackControlsProps) {
  const [quality, setQuality] = useState(75)
  const [radius, setRadius] = useState(5)
  const [angle, setAngle] = useState(45)
  const [amount, setAmount] = useState(10)

  const handleApply = () => {
    const params: any = {}

    if (attackType === "compression") {
      params.quality = quality
    } else if (attackType === "blur") {
      params.radius = radius
    } else if (attackType === "rotation") {
      params.angle = angle
    } else if (attackType === "noise") {
      params.amount = amount
    }

    onApply(params)
  }

  return (
    <div className="space-y-4">
      {attackType === "compression" && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold">Qualité JPEG</label>
            <span className="text-primary">{quality}%</span>
          </div>
          <Slider value={[quality]} onValueChange={(value) => setQuality(value[0])} min={1} max={100} step={1} />
        </div>
      )}

      {attackType === "blur" && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold">Rayon de Flou</label>
            <span className="text-primary">{radius}px</span>
          </div>
          <Slider value={[radius]} onValueChange={(value) => setRadius(value[0])} min={1} max={20} step={1} />
        </div>
      )}

      {attackType === "rotation" && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold">Angle</label>
            <span className="text-primary">{angle}°</span>
          </div>
          <Slider value={[angle]} onValueChange={(value) => setAngle(value[0])} min={-45} max={45} step={1} />
        </div>
      )}

      {attackType === "noise" && (
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold">Quantité de Bruit</label>
            <span className="text-primary">{amount}</span>
          </div>
          <Slider value={[amount]} onValueChange={(value) => setAmount(value[0])} min={0} max={50} step={1} />
        </div>
      )}

      <Button onClick={handleApply} disabled={isProcessing} className="w-full">
        Appliquer l'Attaque
      </Button>
    </div>
  )
}
