import { NextRequest, NextResponse } from 'next/server';
import { extractLSBWatermarkAuto, base64ToImageData } from '@/lib/lsb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageDataBase64 = formData.get('imageData') as string;

    if (!imageDataBase64) {
      return NextResponse.json(
        { success: false, error: 'Image manquante' },
        { status: 400 }
      );
    }

    // Convertir base64 en ImageData
    const imageData = await base64ToImageData(imageDataBase64);

    // Extraire le watermark avec auto-détection (1-4 bits)
    const result = extractLSBWatermarkAuto(imageData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      watermark: result.data || "",
      message: result.message,
      bitsUsed: result.bitsUsed
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
