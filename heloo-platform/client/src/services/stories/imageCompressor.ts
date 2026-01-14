/**
 * Image Compressor
 * Client-side image optimization for stories
 * 
 * @module services/stories/imageCompressor
 */

/** Max image dimension (pixels) */
const MAX_DIMENSION = 1080

/** Target quality for JPEG/WebP (0-1) */
const TARGET_QUALITY = 0.85

/** Target file size (bytes) - ~500KB */
const TARGET_SIZE = 500 * 1024

/**
 * Compress image file to optimal size for stories
 */
export async function compressImage(
    file: File,
    onProgress?: (percent: number) => void
): Promise<Blob> {
    onProgress?.(10)

    // Create image element
    const img = await loadImage(file)
    onProgress?.(30)

    // Calculate new dimensions
    const { width, height } = calculateDimensions(img.width, img.height)
    onProgress?.(40)

    // Draw to canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    ctx.drawImage(img, 0, 0, width, height)
    onProgress?.(60)

    // Try WebP first (better compression)
    let blob = await canvasToBlob(canvas, 'image/webp', TARGET_QUALITY)
    onProgress?.(80)

    // If WebP not supported or too large, try JPEG
    if (!blob || blob.size > TARGET_SIZE) {
        blob = await canvasToBlob(canvas, 'image/jpeg', TARGET_QUALITY)
    }

    // If still too large, reduce quality
    if (blob && blob.size > TARGET_SIZE) {
        blob = await canvasToBlob(canvas, 'image/jpeg', 0.7)
    }

    onProgress?.(100)

    if (!blob) throw new Error('Failed to compress image')
    return blob
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(img)
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Failed to load image'))
        }

        img.src = objectUrl
    })
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number
): { width: number; height: number } {
    if (originalWidth <= MAX_DIMENSION && originalHeight <= MAX_DIMENSION) {
        return { width: originalWidth, height: originalHeight }
    }

    const ratio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
        return {
            width: MAX_DIMENSION,
            height: Math.round(MAX_DIMENSION / ratio)
        }
    }

    return {
        width: Math.round(MAX_DIMENSION * ratio),
        height: MAX_DIMENSION
    }
}

/**
 * Convert canvas to blob with specified format
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob),
            mimeType,
            quality
        )
    })
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
    file: File
): Promise<{ width: number; height: number }> {
    const img = await loadImage(file)
    return { width: img.width, height: img.height }
}
