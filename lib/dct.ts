const N = 8
const PI = Math.PI

export function dct2(block: number[][]): number[][] {
    const result = Array.from({ length: N }, () => Array(N).fill(0))

    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            let sum = 0
            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    sum +=
                        block[x][y] *
                        Math.cos(((2 * x + 1) * u * PI) / (2 * N)) *
                        Math.cos(((2 * y + 1) * v * PI) / (2 * N))
                }
            }
            const cu = u === 0 ? 1 / Math.sqrt(2) : 1
            const cv = v === 0 ? 1 / Math.sqrt(2) : 1
            result[u][v] = (2 / N) * cu * cv * sum
        }
    }
    return result
}

export function idct2(block: number[][]): number[][] {
    const result = Array.from({ length: N }, () => Array(N).fill(0))

    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            let sum = 0
            for (let u = 0; u < N; u++) {
                for (let v = 0; v < N; v++) {
                    const cu = u === 0 ? 1 / Math.sqrt(2) : 1
                    const cv = v === 0 ? 1 / Math.sqrt(2) : 1
                    sum +=
                        cu *
                        cv *
                        block[u][v] *
                        Math.cos(((2 * x + 1) * u * PI) / (2 * N)) *
                        Math.cos(((2 * y + 1) * v * PI) / (2 * N))
                }
            }
            result[x][y] = (2 / N) * sum
        }
    }
    return result
}

export function rgbToYcbcr(r: number, g: number, b: number) {
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    return { y, cb, cr }
}

export function ycbcrToRgb(y: number, cb: number, cr: number) {
    const r = y + 1.402 * (cr - 128)
    const g = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128)
    const b = y + 1.772 * (cb - 128)
    return {
        r: Math.max(0, Math.min(255, r)),
        g: Math.max(0, Math.min(255, g)),
        b: Math.max(0, Math.min(255, b)),
    }
}
