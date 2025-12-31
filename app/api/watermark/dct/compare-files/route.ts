import { compareImages, imageToDataURL } from "@/lib/dct"
import { loadImage } from "canvas"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const image1Data = formData.get("image1") as string
        const image2Data = formData.get("image2") as string

        if (!image1Data || !image2Data) {
            return Response.json({ success: false, error: "Images manquantes" }, { status: 400 })
        }

        const img1 = await loadImage(image1Data)
        const img2 = await loadImage(image2Data)

        if (img1.width !== img2.width || img1.height !== img2.height) {
            return Response.json({ success: false, error: "Les images doivent avoir la même taille" }, { status: 400 })
        }

        // Convert to Uint8ClampedArray
        const canvas1 = createTempCanvas(img1)
        const ctx1 = canvas1.getContext("2d")
        ctx1.drawImage(img1, 0, 0)
        const data1 = ctx1.getImageData(0, 0, img1.width, img1.height).data

        const canvas2 = createTempCanvas(img2)
        const ctx2 = canvas2.getContext("2d")
        ctx2.drawImage(img2, 0, 0)
        const data2 = ctx2.getImageData(0, 0, img2.width, img2.height).data

        const metrics = compareImages(data1, data2)

        return Response.json({
            success: true,
            metrics,
        })
    } catch (error) {
        console.error("Comparison error:", error)
        return Response.json({ success: false, error: "Erreur lors de la comparaison" }, { status: 500 })
    }
}

function createTempCanvas(img: any) {
    const { createCanvas } = require("canvas")
    const canvas = createCanvas(img.width, img.height)
    return canvas
}
