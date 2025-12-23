"use client"

import { Button } from "@/components/ui/button"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: "lsb" | "dct" | "attacks" | "detection") => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: "lsb", label: "📊 LSB Watermarking", icon: "📊" },
    { id: "dct", label: "🔢 DCT Watermarking", icon: "🔢" },
    { id: "attacks", label: "⚔️ Tests d'Attaques", icon: "⚔️" },
    { id: "detection", label: "🔍 Détection", icon: "🔍" },
  ]

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              variant={activeTab === tab.id ? "default" : "outline"}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  )
}
