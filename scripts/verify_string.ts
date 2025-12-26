
import { dct2, idct2, rgbToYcbcr, ycbcrToRgb } from "../lib/dct";

function testStringWatermark() {
    console.log("Testing String Watermark with Null Terminator...");

    // 1. Setup Input
    const originalText = "@Zineb";
    console.log(`Input Text: "${originalText}"`);

    // Simulate Add Route Logic
    const watermarkWithNull = originalText + "\u0000";
    const bits = watermarkWithNull
        .split("")
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("")
        .split("")
        .map(Number);

    console.log(`Bits length: ${bits.length} (Expected ${(originalText.length + 1) * 8})`);

    // 2. Mock Image Processing (Simulate embedding and extraction without full image loop for simplicity)
    // We just simulate that we get the correct bits back + some garbage bits after

    const retrievedBits = [...bits];
    // Add 100 random garbage bits
    for (let i = 0; i < 100; i++) {
        retrievedBits.push(Math.random() > 0.5 ? 1 : 0);
    }

    // 3. Simulate Extract Route Logic
    let retrievedText = "";
    const retrievedBitsString = retrievedBits.join("");

    for (let i = 0; i < retrievedBitsString.length; i += 8) {
        const byte = retrievedBitsString.slice(i, i + 8);
        if (byte.length < 8) break;
        const charCode = parseInt(byte, 2);

        // The Fix Check
        if (charCode === 0) {
            console.log("Null terminator found! Stopping extraction.");
            break;
        }

        retrievedText += String.fromCharCode(charCode);
    }

    console.log(`Extracted Text: "${retrievedText}"`);

    if (retrievedText === originalText) {
        console.log("SUCCESS: Clean watermark extracted.");
    } else {
        console.error("FAILURE: Garbage or incorrect text detected.");
    }
}

testStringWatermark();
