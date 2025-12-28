import { NextRequest, NextResponse } from 'next/server';
import { detectLSBWatermark, base64ToImageData } from '@/lib/lsb';

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

    // Détecter le watermark
    const result = detectLSBWatermark(imageData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      detected: result.data?.includes('détecté'),
      message: result.data,
      analysis: {
        hasWatermark: result.data?.includes('Watermark détecté'),
        confidence: result.metrics?.pixelsModified || 0
      }
    });

  } catch (error) {
    console.error('Erreur dans /api/watermark/detect/lsb:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}