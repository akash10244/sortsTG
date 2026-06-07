/**
 * imageCompressor.ts
 *
 * Compresses an image client-side using Canvas.
 * Outputs a JPEG Blob at 80% quality, restricted to a maximum width or height of 1200px.
 */

export function compressImage(
  fileOrBlob: File | Blob,
  maxWidthOrHeight = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Basic type validation
    if (!fileOrBlob.type.startsWith('image/')) {
      // Not an image, pass it through as-is
      resolve(fileOrBlob);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Prevent tainted canvas when loading from CDN URL
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2d context'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => {
        console.error('Image load error during compression:', err);
        reject(new Error('Failed to load image source'));
      };
      if (e.target?.result && typeof e.target.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('FileReader result was empty or not a string'));
      }
    };
    reader.onerror = (err) => {
      console.error('FileReader error during compression:', err);
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(fileOrBlob);
  });
}
