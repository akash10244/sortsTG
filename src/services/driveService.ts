/**
 * driveService.ts
 *
 * Raw Google Drive API operations via REST (no gapi.client.drive dependency).
 * All methods obtain a fresh access token from authService automatically.
 */

import { gapi } from 'gapi-script';
import { getValidAccessToken } from './authService';
import { DRIVE_FOLDER_PATH } from '../config';
import type { UploadResult } from '../types';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// ─── Init ─────────────────────────────────────────────────────────────────────

let gapiInitialized = false;

export async function initGapiClient(accessToken: string): Promise<void> {
  if (!gapiInitialized) {
    await new Promise<void>((resolve) => gapi.load('client', resolve));
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInitialized = true;
  }
  gapi.client.setToken({ access_token: accessToken });
}

// ─── Folder management ────────────────────────────────────────────────────────

/**
 * Walk (and create if missing) each segment of DRIVE_FOLDER_PATH.
 * Returns the final folder's ID.
 */
export async function getOrCreateAppFolder(): Promise<string> {
  const parts = DRIVE_FOLDER_PATH.split('/');
  let parentId = 'root';

  for (const part of parts) {
    const token = await getValidAccessToken();
    gapi.client.setToken({ access_token: token });

    const res = await (gapi.client as any).drive.files.list({
      q: `name='${part}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const files: any[] = res.result.files ?? [];
    if (files.length > 0) {
      parentId = files[0].id;
    } else {
      const createRes = await (gapi.client as any).drive.files.create({
        resource: {
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
      });
      parentId = createRes.result.id;
    }
  }

  return parentId;
}

/**
 * Get (or create) a named sub-folder inside a given parent folder.
 * Returns the sub-folder's ID.
 *
 * Uses a promise cache to prevent duplicate folders when called concurrently
 * (e.g. React 18 Strict Mode double-invokes effects in development).
 */
const _subFolderCache = new Map<string, Promise<string>>();

export function getOrCreateSubFolder(
  name: string,
  parentFolderId: string
): Promise<string> {
  const key = `${parentFolderId}/${name}`;
  if (_subFolderCache.has(key)) return _subFolderCache.get(key)!;

  const promise = _doGetOrCreateSubFolder(name, parentFolderId).catch(err => {
    _subFolderCache.delete(key); // allow retry on failure
    throw err;
  });
  _subFolderCache.set(key, promise);
  return promise;
}

async function _doGetOrCreateSubFolder(
  name: string,
  parentFolderId: string
): Promise<string> {
  const token = await getValidAccessToken();
  gapi.client.setToken({ access_token: token });

  const res = await (gapi.client as any).drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  const files: any[] = res.result.files ?? [];
  if (files.length > 0) return files[0].id;

  const createRes = await (gapi.client as any).drive.files.create({
    resource: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });
  return createRes.result.id;
}

// ─── Image upload ─────────────────────────────────────────────────────────────

/**
 * Upload a file to the given Drive folder.
 * Returns { id, webViewLink } of the uploaded file.
 */
export async function uploadFile(file: File, parentFolderId: string): Promise<UploadResult> {
  const token = await getValidAccessToken();

  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [parentFolderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  const data = await res.json();

  // Give Drive a moment to finish indexing before the permissions call
  await sleep(400);

  return { id: data.id as string, webViewLink: data.webViewLink as string };
}

/** Simple promise-based sleep */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a Drive file publicly readable so it can be embedded in <img> tags
 * without OAuth headers.
 *
 * Retries up to 4 times with exponential backoff because Drive sometimes needs
 * a few seconds to finish indexing a newly-uploaded file before the permissions
 * endpoint accepts the request.
 */
export async function makeFilePublic(fileId: string, attempt = 1): Promise<void> {
  const token = await getValidAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  );

  if (res.ok) return;

  // Retry on server errors (5xx) or 404 (file not yet indexed)
  const retryable = res.status === 404 || res.status >= 500;
  if (retryable && attempt < 5) {
    const delay = 500 * Math.pow(2, attempt - 1); // 500, 1000, 2000, 4000 ms
    console.warn(`makeFilePublic: attempt ${attempt} failed (${res.status}), retrying in ${delay}ms…`);
    await sleep(delay);
    return makeFilePublic(fileId, attempt + 1);
  }

  throw new Error(`makeFilePublic failed after ${attempt} attempt(s): ${res.status} ${res.statusText}`);
}

/**
 * Delete a file from Drive permanently.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const token = await getValidAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  // 204 = success; 404 = already gone (acceptable)
  if (!res.ok && res.status !== 404) {
    throw new Error(`deleteFile failed: ${res.statusText}`);
  }
}

/**
 * Build the direct-embed URL for a Drive file ID.
 * Uses the Drive thumbnail API which reliably returns raw image bytes for
 * publicly shared files without redirects or consent screens.
 * sz=s1200 gives good resolution for display; lightbox uses s2000.
 */
export function driveImageUrl(fileId: string, size: 's800' | 's1200' | 's2000' = 's1200'): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}

// ─── JSON data ────────────────────────────────────────────────────────────────

const _fileIdCache = new Map<string, string>();

/**
 * Save (create or overwrite) a JSON file in the app folder.
 * Returns the file ID.
 */
export async function saveJson<T>(filename: string, data: T, parentFolderId: string): Promise<string> {
  const token = await getValidAccessToken();
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  const cacheKey = `${parentFolderId}/${filename}`;
  let existingId = _fileIdCache.get(cacheKey);

  if (!existingId) {
    // Check if a file with this name already exists
    gapi.client.setToken({ access_token: token });
    const searchRes = await (gapi.client as any).drive.files.list({
      q: `name='${filename}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });
    const existing: any[] = searchRes.result.files ?? [];
    if (existing.length > 0) {
      existingId = existing[0].id as string;
      _fileIdCache.set(cacheKey, existingId);
    }
  }

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
  let method = 'POST';
  const metadata: Record<string, any> = { name: filename, mimeType: 'application/json' };

  if (existingId) {
    // PATCH to update existing file (no parents field on update)
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id`;
    method = 'PATCH';
  } else {
    metadata.parents = [parentFolderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', jsonBlob);

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Save failed: ${res.statusText}`);
  const result = await res.json();
  const fileId = result.id as string;
  _fileIdCache.set(cacheKey, fileId);
  return fileId;
}

/**
 * Load a JSON file from the app folder. Returns null if the file does not exist.
 */
export async function loadJson<T>(filename: string, parentFolderId: string): Promise<T | null> {
  const token = await getValidAccessToken();
  gapi.client.setToken({ access_token: token });

  const searchRes = await (gapi.client as any).drive.files.list({
    q: `name='${filename}' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });
  const existing: any[] = searchRes.result.files ?? [];
  if (existing.length === 0) return null;
  const fileId = existing[0].id;

  _fileIdCache.set(`${parentFolderId}/${filename}`, fileId);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existing[0].id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Load failed: ${res.statusText}`);
  return (await res.json()) as T;
}
