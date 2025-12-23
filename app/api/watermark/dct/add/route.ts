export async function POST(request: Request) {
  // TODO: Implémenter le watermarking DCT
  // - Charger l'image
  // - Diviser en blocs 8x8
  // - Appliquer la DCT à chaque bloc
  // - Modifier les coefficients moyens
  // - Appliquer la DCT inverse
  // - Retourner l'image watermarkée

  return Response.json(
    {
      success: false,
      message: "À implémenter",
    },
    { status: 501 },
  )
}
