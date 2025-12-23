"use client"

import { useState } from "react"
import Header from "@/components/header"
import Navigation from "@/components/navigation"
import LSBModule from "@/components/modules/lsb-module"
import DCTModule from "@/components/modules/dct-module"
import AttackTestModule from "@/components/modules/attack-test-module"
import DetectionModule from "@/components/modules/detection-module"

type TabType = "lsb" | "dct" | "attacks" | "detection"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("lsb")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-8">
        {activeTab === "lsb" && <LSBModule />}
        {activeTab === "dct" && <DCTModule />}
        {activeTab === "attacks" && <AttackTestModule />}
        {activeTab === "detection" && <DetectionModule />}
      </main>
    </div>
  )
}
