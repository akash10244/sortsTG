/**
 * imagekitService.ts
 *
 * Direct ImageKit API operations from browser context using Private API key.
 * (Acceptable risk for a private personal contact manager app).
 */

import { IMAGEKIT_CONFIG } from '../config';

/**
 * Upload an image file or blob to ImageKit.
 * Returns the ImageKit file ID and CDN URL.
 */
export async function uploadToImageKit(
  file: File | Blob,
  fileName: string
): Promise<{ fileId: string; url: string }> {
  const url = 'https://upload.imagekit.io/api/v1/files/upload';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('folder', '/sortsTG');
  formData.append('useUniqueFileName', 'true');

  const authHeader = 'Basic ' + btoa(IMAGEKIT_CONFIG.privateKey + ':');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ImageKit upload failed: ${response.statusText} (${errText})`);
  }

  const result = await response.json();
  return {
    fileId: result.fileId as string,
    url: result.url as string,
  };
}

/**
 * Delete a file from ImageKit permanently.
 */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  const url = `https://api.imagekit.io/v1/files/${fileId}`;
  const authHeader = 'Basic ' + btoa(IMAGEKIT_CONFIG.privateKey + ':');

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: authHeader,
    },
  });

  // 204 No Content is success, 404 is acceptable (already gone)
  if (!response.ok && response.status !== 404) {
    const errText = await response.text();
    throw new Error(`ImageKit delete failed: ${response.statusText} (${errText})`);
  }
}
