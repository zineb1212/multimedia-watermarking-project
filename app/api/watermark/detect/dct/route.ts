export async function POST(request: Request) {
  // TODO: Implémenter la détection DCT
  // - Analyser les coefficients DCT
  // - Calculer la confiance
  // - Tenter d'extraire le watermark

  return Response.json(
    {
      success: false,
      message: "À implémenter",
    },
    { status: 501 },
  )
}
