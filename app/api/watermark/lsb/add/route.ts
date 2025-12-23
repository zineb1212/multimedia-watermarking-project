export async function POST(request: Request) {
  // TODO: Implémenter le watermarking LSB
  // - Charger l'image
  // - Convertir en pixels
  // - Encoder le watermark dans les bits LSB
  // - Retourner l'image watermarkée

  return Response.json(
    {
      success: false,
      message: "À implémenter",
    },
    { status: 501 },
  )
}
