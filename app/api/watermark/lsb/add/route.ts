import { NextRequest, NextResponse } from 'next/server';
import { addLSBWatermark, base64ToImageData } from '@/lib/lsb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageDataBase64 = formData.get('imageData') as string;
    const watermark = formData.get('watermark') as string;
    const lsbBits = parseInt(formData.get('lsbBits') as string) || 1;

    if (!imageDataBase64 || !watermark) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Convertir base64 en ImageData
    let imageData: ImageData;
    try {
      imageData = await base64ToImageData(imageDataBase64);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Erreur de conversion d'image: ${error instanceof Error ? error.message : String(error)}` },
        { status: 400 }
      );
    }

    // Ajouter le watermark
    const result = addLSBWatermark(imageData, watermark, lsbBits);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      watermarkedImage: result.data,
      metrics: result.metrics
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
