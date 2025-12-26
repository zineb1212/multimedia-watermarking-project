import { createCanvas, loadImage } from "canvas"
import { dct2, rgbToYcbcr } from "@/lib/dct"

export async function POST(request: Request) {
  const formData = await request.formData()
  const imageData = formData.get("imageData") as string

  const img = await loadImage(imageData)
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")

  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, img.width, img.height)

  let bits = ""

  for (let i = 0; i < img.height - 8; i += 8) {
    for (let j = 0; j < img.width - 8; j += 8) {
      const yBlock: number[][] = []

      for (let x = 0; x < 8; x++) {
        yBlock[x] = []
        for (let y = 0; y < 8; y++) {
          const idx = ((i + x) * img.width + (j + y)) * 4
          const r = image.data[idx]
          const g = image.data[idx + 1]
          const b = image.data[idx + 2]

          const { y: Y } = rgbToYcbcr(r, g, b)
          yBlock[x][y] = Y
        }
      }

      const dct = dct2(yBlock)
      bits += dct[4][4] > 0 ? "1" : "0"
    }
  }

  let text = ""
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8)
    if (byte.length < 8) break
    const charCode = parseInt(byte, 2)
    if (charCode === 0) break
    text += String.fromCharCode(charCode)
  }

  return Response.json({
    success: true,
    watermark: text,
  })
}
