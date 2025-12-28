import { NextRequest, NextResponse } from 'next/server';
import { addLSBWatermark, base64ToImageData } from '@/lib/lsb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageDataBase64 = formData.get('imageData') as string;
    const watermark = formData.get('watermark') as string;

    if (!imageDataBase64 || !watermark) {
      return NextResponse.json(
        { success: false, error: 'Image et watermark requis' },
        { status: 400 }
      );
    }

    // Convertir base64 en ImageData
    const originalImageData = await base64ToImageData(imageDataBase64);

    // Générer des versions watermarkées avec 1, 2, 3, 4 bits LSB
    const results = [];
    
    for (let nBits = 1; nBits <= 4; nBits++) {
      const result = addLSBWatermark(originalImageData, watermark, nBits);
      
      if (result.success && result.metrics) {
        results.push({
          bits: nBits,
          image: result.data,
          psnr: result.metrics.psnr,
          mse: result.metrics.mse,
          pixelsModified: result.metrics.pixelsModified
        });
      }
    }

    return NextResponse.json({
      success: true,
      originalImage: imageDataBase64,
      comparisons: results
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
