
import { NextRequest, NextResponse } from 'next/server';
import { compareImages, base64ToImageData } from '@/lib/lsb';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image1Base64 = formData.get('image1') as string;
        const image2Base64 = formData.get('image2') as string;

        if (!image1Base64 || !image2Base64) {
            return NextResponse.json(
                { success: false, error: 'Les deux images sont requises' },
                { status: 400 }
            );
        }

        // Convertir base64 en ImageData
        const image1 = await base64ToImageData(image1Base64);
        const image2 = await base64ToImageData(image2Base64);

        if (image1.width !== image2.width || image1.height !== image2.height) {
            return NextResponse.json(
                { success: false, error: 'Les images doivent avoir la même taille' },
                { status: 400 }
            );
        }

        const metrics = compareImages(image1, image2);

        return NextResponse.json({
            success: true,
            metrics
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Erreur serveur lors de la comparaison' },
            { status: 500 }
        );
    }
}
