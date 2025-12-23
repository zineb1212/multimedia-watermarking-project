"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface LSBControlsProps {
  lsbBits: number
  onLsbBitsChange: (value: number) => void
}

export default function LSBControls({ lsbBits, onLsbBitsChange }: LSBControlsProps) {
  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-base">Paramètres LSB</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold">Nombre de bits LSB</label>
            <span className="text-primary font-semibold">{lsbBits}</span>
          </div>
          <Slider
            value={[lsbBits]}
            onValueChange={(value) => onLsbBitsChange(value[0])}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">
            1 bit = plus subtile | 4 bits = plus robuste mais visible
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
