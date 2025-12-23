export async function POST(request: Request) {
  // TODO: Implémenter l'extraction DCT
  // - Charger l'image
  // - Diviser en blocs 8x8
  // - Appliquer la DCT à chaque bloc
  // - Extraire les coefficients modifiés
  // - Décoder le watermark
  // - Retourner le texte extrait

  return Response.json(
    {
      success: false,
      message: "À implémenter",
    },
    { status: 501 },
  )
}
