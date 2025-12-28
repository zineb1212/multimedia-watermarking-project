/**
 * Bibliothèque optimisée pour le watermarking LSB (Least Significant Bit)
 */

export interface LSBResult {
  success: boolean;
  data?: string;
  message?: string;
  metrics?: {
    psnr: number;
    mse: number;
    pixelsModified: number;
  };
}

export interface ImageComparisonResult {
  psnr: number;
  mse: number;
  pixelsModified: number;
}

/**
 * Ajoute un watermark textuel dans une image en utilisant la méthode LSB
 */
export function addLSBWatermark(
  imageData: ImageData,
  watermarkText: string,
  lsbBits: number = 1
): LSBResult {
  try {
    const delimiter = "###END###";
    const messageComplet = watermarkText + delimiter;

    // Convertir le message en bits
    const bits: number[] = [];
    for (let i = 0; i < messageComplet.length; i++) {
      const code = messageComplet.charCodeAt(i);
      for (let j = 7; j >= 0; j--) {
        bits.push((code >> j) & 1);
      }
    }

    // Vérifier la capacité
    const totalPixels = imageData.width * imageData.height;
    const canauxUtilisables = totalPixels * 3;
    const capaciteBits = canauxUtilisables * lsbBits;

    if (bits.length > capaciteBits) {
      return {
        success: false,
        message: `Message trop long. Capacité: ${capaciteBits} bits, Requis: ${bits.length} bits.`
      };
    }

    const watermarkedData = new Uint8ClampedArray(imageData.data);
    const mask = ~((1 << lsbBits) - 1);

    let bitIndex = 0;

    // Parcourir les pixels - optimisé
    for (let i = 0; i < watermarkedData.length && bitIndex < bits.length; i++) {
      // Sauter le canal alpha
      if ((i + 1) % 4 === 0) continue;

      // Récupérer les prochains bits à insérer
      let bitsToInsert = 0;
      let bitsTaken = 0;

      while (bitsTaken < lsbBits && bitIndex < bits.length) {
        bitsToInsert = (bitsToInsert << 1) | bits[bitIndex];
        bitIndex++;
        bitsTaken++;
      }

      // Aligner si nécessaire
      if (bitsTaken < lsbBits) {
        bitsToInsert = bitsToInsert << (lsbBits - bitsTaken);
      }

      // Appliquer le watermark
      watermarkedData[i] = (watermarkedData[i] & mask) | bitsToInsert;
    }

    // Calculer les métriques
    const metrics = calculateMetricsInternal(imageData.data, watermarkedData);

    // Reconstruire l'objet ImageData
    const resultImageData = typeof ImageData !== 'undefined'
      ? new ImageData(watermarkedData, imageData.width, imageData.height)
      : {
          data: watermarkedData,
          width: imageData.width,
          height: imageData.height,
          colorSpace: 'srgb'
        } as unknown as ImageData;

    return {
      success: true,
      data: imageDataToBase64(resultImageData),
      metrics
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur d'insertion: ${error}`
    };
  }
}

/**
 * Extrait un watermark textuel d'une image watermarkée
 * OPTIMISÉ: Arrêt immédiat après délimiteur, validation des caractères
 * CORRIGÉ: Gestion correcte pour 1-4 bits LSB
 */
export function extractLSBWatermark(
  imageData: ImageData,
  lsbBits: number = 1
): LSBResult {
  try {
    const delimiter = "###END###";
    const data = imageData.data;
    // Augmenter la limite pour les images watermarkées avec 4 bits
    const maxPixelsToCheck = Math.min(data.length, 100000);

    let currentByte = 0;
    let bitsCollected = 0;
    let extractedText = "";
    const mask = (1 << lsbBits) - 1;

    // Extraction optimisée avec arrêt précoce
    for (let i = 0; i < maxPixelsToCheck; i++) {
      // Sauter alpha
      if ((i + 1) % 4 === 0) continue;

      // Extraire les bits LSB de ce canal
      const val = data[i] & mask;

      // Extraire les bits dans l'ordre correct (MSB first pour chaque groupe de lsbBits)
      // Pour 4 bits: on extrait les 4 bits du canal, puis on les ajoute au byte
      for (let b = lsbBits - 1; b >= 0; b--) {
        const bit = (val >> b) & 1;
        currentByte = (currentByte << 1) | bit;
        bitsCollected++;

        if (bitsCollected === 8) {
          // Valider le caractère (printable ASCII)
          if (currentByte >= 32 && currentByte <= 126 || currentByte === 10 || currentByte === 13 || currentByte === 9) {
            const char = String.fromCharCode(currentByte);
            extractedText += char;

            // Vérification du délimiteur (optimisé)
            if (char === delimiter[delimiter.length - 1] && extractedText.endsWith(delimiter)) {
              // Retirer le délimiteur
              extractedText = extractedText.slice(0, -delimiter.length);
              
              // Validation finale: vérifier que le texte extrait est cohérent
              if (extractedText.length > 0 && isValidWatermarkText(extractedText)) {
                return {
                  success: true,
                  data: extractedText,
                  message: undefined
                };
              }
            }
          } else if (currentByte === 0 && extractedText.length > 0) {
            // Caractère null trouvé - peut être la fin du message
            if (extractedText.endsWith(delimiter)) {
              extractedText = extractedText.slice(0, -delimiter.length);
              if (isValidWatermarkText(extractedText)) {
                return {
                  success: true,
                  data: extractedText,
                  message: undefined
                };
              }
            }
          }

          // Reset pour le prochain octet
          currentByte = 0;
          bitsCollected = 0;
        }
      }
    }

    // Si pas de délimiteur trouvé, filtrer et retourner ce qu'on a
    const cleanText = extractedText
      .split('')
      .filter(char => {
        const code = char.charCodeAt(0);
        return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
      })
      .join('')
      .replace(/\0/g, ''); // Supprimer les caractères null

    // Vérifier si le texte semble valide
    if (cleanText.length > 0 && isValidWatermarkText(cleanText)) {
      return {
        success: true,
        data: cleanText,
        message: undefined
      };
    }

    return {
      success: true,
      data: "",
      message: "Aucun watermark détecté ou image non marquée."
    };

  } catch (error) {
    return {
      success: false,
      message: `Erreur d'extraction: ${error}`
    };
  }
}

/**
 * Valide si un texte extrait semble être un watermark valide
 */
function isValidWatermarkText(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  // Vérifier qu'il y a au moins quelques caractères alphanumériques
  const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const totalLength = text.length;
  
  // Au moins 30% de caractères alphanumériques pour être valide
  if (totalLength < 3) return false;
  if (alphanumericCount / totalLength < 0.3) return false;
  
  // Vérifier qu'il n'y a pas trop de caractères spéciaux consécutifs
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialChars / totalLength > 0.7) return false;
  
  return true;
}

/**
 * Extrait un watermark en essayant automatiquement 1-4 bits
 * Retourne le premier résultat valide trouvé avec validation améliorée
 */
export function extractLSBWatermarkAuto(imageData: ImageData): LSBResult & { bitsUsed?: number } {
  let bestResult: (LSBResult & { bitsUsed?: number }) | null = null;
  let bestScore = 0;

  // Essayer chaque nombre de bits
  for (let bits = 1; bits <= 4; bits++) {
    const result = extractLSBWatermark(imageData, bits);
    
    if (result.success && result.data && result.data.length > 0) {
      // Calculer un score de qualité pour ce résultat
      const score = calculateExtractionScore(result.data);
      
      // Si on trouve un résultat avec délimiteur et score élevé, c'est probablement le bon
      if (!result.message && score > bestScore) {
        bestResult = { ...result, bitsUsed: bits };
        bestScore = score;
        
        // Si le score est très élevé (> 0.8), on peut s'arrêter
        if (score > 0.8) {
          return bestResult;
        }
      }
    }
  }
  
  // Retourner le meilleur résultat trouvé
  if (bestResult) {
    return bestResult;
  }
  
  // Si aucun résultat valide, retourner le résultat avec 1 bit
  const lastResult = extractLSBWatermark(imageData, 1);
  return { ...lastResult, bitsUsed: 1 };
}

/**
 * Calcule un score de qualité pour un texte extrait
 * Score entre 0 et 1, plus élevé = plus probablement correct
 */
function calculateExtractionScore(text: string): number {
  if (!text || text.length === 0) return 0;
  
  let score = 0;
  
  // Bonus pour longueur raisonnable (10-200 caractères)
  if (text.length >= 10 && text.length <= 200) {
    score += 0.3;
  } else if (text.length > 0) {
    score += 0.1;
  }
  
  // Bonus pour ratio alphanumérique élevé
  const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const alphanumericRatio = alphanumericCount / text.length;
  score += alphanumericRatio * 0.3;
  
  // Bonus pour présence d'espaces (texte lisible)
  const spaceCount = (text.match(/\s/g) || []).length;
  if (spaceCount > 0 && spaceCount / text.length < 0.3) {
    score += 0.2;
  }
  
  // Pénalité pour trop de caractères spéciaux
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const specialRatio = specialChars / text.length;
  if (specialRatio > 0.5) {
    score -= 0.3;
  }
  
  // Bonus si contient des mots communs
  const commonWords = ['hello', 'test', 'watermark', 'secret', 'message', 'text'];
  const lowerText = text.toLowerCase();
  if (commonWords.some(word => lowerText.includes(word))) {
    score += 0.2;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Compare deux images pour l'évaluation de qualité (PSNR, MSE)
 */
export function compareImages(
  image1: ImageData | Uint8ClampedArray,
  image2: ImageData | Uint8ClampedArray
): ImageComparisonResult {
  const getData = (img: ImageData | Uint8ClampedArray): Uint8ClampedArray => {
    if ('data' in (img as any)) {
      return (img as ImageData).data;
    }
    return img as Uint8ClampedArray;
  };

  const data1 = getData(image1);
  const data2 = getData(image2);

  if (data1.length !== data2.length) {
    throw new Error("Les images doivent avoir la même taille pour être comparées.");
  }

  return calculateMetricsInternal(data1, data2);
}

/**
 * Fonction interne de calcul de métriques (PSNR et MSE)
 */
function calculateMetricsInternal(
  original: Uint8ClampedArray,
  modified: Uint8ClampedArray
): ImageComparisonResult {
  let sumSquaredDiff = 0;
  let pixelsModified = 0;
  let channelsCounted = 0;

  for (let i = 0; i < original.length; i++) {
    // Ignorer le canal alpha
    if ((i + 1) % 4 === 0) continue;

    channelsCounted++;
    const diff = original[i] - modified[i];
    sumSquaredDiff += diff * diff;

    if (diff !== 0) pixelsModified++;
  }

  const mse = channelsCounted > 0 ? sumSquaredDiff / channelsCounted : 0;
  const psnr = mse === 0 ? Infinity : 20 * Math.log10(255 / Math.sqrt(mse));

  return {
    psnr: Number.isFinite(psnr) ? psnr : 100,
    mse,
    pixelsModified
  };
}

// Helpers pour compatibilité base64

export function imageDataToBase64(imageData: ImageData): string {
  if (typeof document === 'undefined') {
    // Côté serveur
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    const newImgData = ctx.createImageData(imageData.width, imageData.height);
    newImgData.data.set(imageData.data);
    ctx.putImageData(newImgData, 0, 0);
    return canvas.toDataURL();
  } else {
    // Côté client
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
}

export async function base64ToImageData(base64: string): Promise<ImageData> {
  if (typeof window === 'undefined') {
    // Côté serveur
    const { loadImage, createCanvas } = require('canvas');
    const img = await loadImage(base64);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  } else {
    // Côté client
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("No Canvas Context"));
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = base64;
    });
  }
}
