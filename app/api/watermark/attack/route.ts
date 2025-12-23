export async function POST(request: Request) {
  // TODO: Implémenter les attaques
  // - Compression JPEG
  // - Flou Gaussien
  // - Rotation
  // - Bruit Gaussien

  return Response.json(
    {
      success: false,
      message: "À implémenter",
    },
    { status: 501 },
  )
}
