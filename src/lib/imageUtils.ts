/**
 * Convert an image File to WebP format using Canvas API.
 * Returns the original file if it's already WebP, not an image, or conversion fails.
 * Quality: 0.85 (high quality, good compression)
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  // Skip if already webp or not an image
  if (file.type === 'image/webp' || !file.type.startsWith('image/')) {
    return file;
  }

  // Skip SVGs - they don't benefit from raster conversion
  if (file.type === 'image/svg+xml') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
    
    // Generate new filename with .webp extension
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch (err) {
    console.warn('WebP conversion failed, using original file:', err);
    return file;
  }
}
