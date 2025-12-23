"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface DCTControlsProps {
  strength: number
  onStrengthChange: (value: number) => void
}

export default function DCTControls({ strength, onStrengthChange }: DCTControlsProps) {
  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-base">Paramètres DCT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold">Force du Watermark</label>
            <span className="text-primary font-semibold">{(strength * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[strength]}
            onValueChange={(value) => onStrengthChange(value[0])}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">Faible = invisible | Forte = visible mais robuste</p>
        </div>
      </CardContent>
    </Card>
  )
}
