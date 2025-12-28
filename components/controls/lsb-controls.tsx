"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface LSBControlsProps {
  lsbBits: number
  onLsbBitsChange: (value: number) => void
}

const bitLabels = {
  1: "Invisible",
  2: "Subtile",
  3: "Robuste",
  4: "Très robuste"
}

export default function LSBControls({ lsbBits, onLsbBitsChange }: LSBControlsProps) {
  return (
    <Card className="bg-muted/30 p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Bits LSB:</span>
            <RadioGroup
              value={lsbBits.toString()}
              onValueChange={(value) => onLsbBitsChange(parseInt(value))}
              className="flex gap-2"
            >
              {[1, 2, 3, 4].map((value) => (
                <div key={value} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <RadioGroupItem
                      value={value.toString()}
                      id={`lsb-${value}`}
                      className="size-3"
                    />
                    <Label
                      htmlFor={`lsb-${value}`}
                      className="cursor-pointer text-xs font-medium"
                    >
                      {value}
                    </Label>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {bitLabels[value as keyof typeof bitLabels]}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Badge variant="secondary" className="text-xs">
            {lsbBits} bit{lsbBits > 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Conseil : Utilisez 1 ou 2 bits pour un watermark invisible
        </p>
      </div>
    </Card>
  )
}
