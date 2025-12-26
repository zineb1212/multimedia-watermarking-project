
import { dct2, idct2, rgbToYcbcr, ycbcrToRgb } from "../lib/dct";

// Mock 8x8 block of random image data
function generateRandomBlock() {
    const block: any = { r: [], g: [], b: [] };
    for (let x = 0; x < 8; x++) {
        block.r[x] = [];
        block.g[x] = [];
        block.b[x] = [];
        for (let y = 0; y < 8; y++) {
            block.r[x][y] = Math.floor(Math.random() * 256);
            block.g[x][y] = Math.floor(Math.random() * 256);
            block.b[x][y] = Math.floor(Math.random() * 256);
        }
    }
    return block;
}

function testWatermark() {
    console.log("Testing Watermark Logic...");
    const rgbBlock = generateRandomBlock();

    // 1. Convert to YCbCr
    const yBlock: number[][] = [];
    const cbBlock: number[][] = [];
    const crBlock: number[][] = [];

    for (let x = 0; x < 8; x++) {
        yBlock[x] = [];
        cbBlock[x] = [];
        crBlock[x] = [];
        for (let y = 0; y < 8; y++) {
            const { y: Y, cb, cr } = rgbToYcbcr(rgbBlock.r[x][y], rgbBlock.g[x][y], rgbBlock.b[x][y]);
            yBlock[x][y] = Y;
            cbBlock[x][y] = cb;
            crBlock[x][y] = cr;
        }
    }


    // Test Bit 1
    console.log("Testing Bit 1...");
    let dct = dct2(yBlock);
    dct[4][4] = 50; // alpha
    let idct = idct2(dct);

    // Roundtrip 1
    let tempR: number[][] = [], tempG: number[][] = [], tempB: number[][] = [];
    for (let x = 0; x < 8; x++) {
        tempR[x] = []; tempG[x] = []; tempB[x] = [];
        for (let y = 0; y < 8; y++) {
            const { r, g, b } = ycbcrToRgb(idct[x][y], cbBlock[x][y], crBlock[x][y]);
            tempR[x][y] = Math.max(0, Math.min(255, Math.round(r)));
            tempG[x][y] = Math.max(0, Math.min(255, Math.round(g)));
            tempB[x][y] = Math.max(0, Math.min(255, Math.round(b)));
        }
    }
    // Extract 1
    let extractedBlock: number[][] = [];
    for (let x = 0; x < 8; x++) {
        extractedBlock[x] = [];
        for (let y = 0; y < 8; y++) {
            const { y: Y } = rgbToYcbcr(tempR[x][y], tempG[x][y], tempB[x][y]);
            extractedBlock[x][y] = Y;
        }
    }
    let finalDct = dct2(extractedBlock);
    console.log(`Bit 1 -> extracted coeff: ${finalDct[4][4].toFixed(2)} (Expect > 0)`);
    if (finalDct[4][4] <= 0) console.error("FAILURE Bit 1");

    // Test Bit 0
    console.log("Testing Bit 0...");
    dct = dct2(yBlock);
    dct[4][4] = -50; // -alpha
    idct = idct2(dct);

    // Roundtrip 0
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const { r, g, b } = ycbcrToRgb(idct[x][y], cbBlock[x][y], crBlock[x][y]);
            tempR[x][y] = Math.max(0, Math.min(255, Math.round(r)));
            tempG[x][y] = Math.max(0, Math.min(255, Math.round(g)));
            tempB[x][y] = Math.max(0, Math.min(255, Math.round(b)));
        }
    }
    // Extract 0
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const { y: Y } = rgbToYcbcr(tempR[x][y], tempG[x][y], tempB[x][y]);
            extractedBlock[x][y] = Y;
        }
    }
    finalDct = dct2(extractedBlock);
    console.log(`Bit 0 -> extracted coeff: ${finalDct[4][4].toFixed(2)} (Expect < 0)`);
    if (finalDct[4][4] >= 0) console.error("FAILURE Bit 0");
    else console.log("SUCCESS: Both bits recovered.");
}

testWatermark();
