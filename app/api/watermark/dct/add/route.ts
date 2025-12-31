import { createCanvas, loadImage } from "canvas"
import { dct2, idct2, rgbToYcbcr, ycbcrToRgb, calculateMetricsInternal } from "@/lib/dct"

export async function POST(request: Request) {
  const formData = await request.formData()

  const imageData = formData.get("imageData") as string
  const watermark = formData.get("watermark") as string
  const strength = parseFloat(formData.get("strength") as string)

  const alpha = 20 + strength * 50

  const img = await loadImage(imageData)
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")

  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, img.width, img.height)
  const originalData = new Uint8ClampedArray(image.data) // Copy original data


  // convertir watermark en bits
  const bits = (watermark + "\u0000")
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("")
    .split("")
    .map(Number)

  let bitIndex = 0

  for (let i = 0; i < img.height - 8; i += 8) {
    for (let j = 0; j < img.width - 8; j += 8) {
      if (bitIndex >= bits.length) break

      const yBlock: number[][] = []
      const cbBlock: number[][] = []
      const crBlock: number[][] = []

      // Extract RGB and convert to YCbCr
      for (let x = 0; x < 8; x++) {
        yBlock[x] = []
        cbBlock[x] = []
        crBlock[x] = []
        for (let y = 0; y < 8; y++) {
          const idx = ((i + x) * img.width + (j + y)) * 4
          const r = image.data[idx]
          const g = image.data[idx + 1]
          const b = image.data[idx + 2]

          const { y: Y, cb, cr } = rgbToYcbcr(r, g, b)
          yBlock[x][y] = Y
          cbBlock[x][y] = cb
          crBlock[x][y] = cr
        }
      }

      // Apply DCT to Y channel
      const dct = dct2(yBlock)

      // Embed bit
      dct[4][4] = bits[bitIndex] === 1 ? alpha : -alpha

      // Apply IDCT
      const idct = idct2(dct)

      // Convert back to RGB and save
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const idx = ((i + x) * img.width + (j + y)) * 4
          const Y = idct[x][y]
          const cb = cbBlock[x][y]
          const cr = crBlock[x][y]

          const { r, g, b } = ycbcrToRgb(Y, cb, cr)

          image.data[idx] = r
          image.data[idx + 1] = g
          image.data[idx + 2] = b
          // Alpha channel remains unchanged
        }
      }

      bitIndex++
    }
  }

  ctx.putImageData(image, 0, 0)

  const metrics = calculateMetricsInternal(originalData, image.data)

  return Response.json({
    success: true,
    watermarkedImage: canvas.toDataURL("image/png"),
    metrics
  })
  // We need to keep a copy of original data.

  // Correction in logic:
  // 1. ctx.drawImage(img, 0, 0)
  // 2. const original = ctx.getImageData(0, 0, ...).data; (ClampedArray)
  // 3. const workingCopy = new Uint8ClampedArray(original);
  // 4. Do processing on workingCopy.
  // 5. Create new ImageData(workingCopy, ...) and put it.
  // OR: Just re-draw img to a temp canvas to get original data? 
  // The current code modifies `image.data` in place. `image` was obtained via `ctx.getImageData`.

  // Let's grab original data BEFORE processing.

}
