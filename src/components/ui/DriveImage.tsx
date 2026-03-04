/**
 * DriveImage.tsx
 *
 * Fetches a Google Drive file as a blob using the authenticated Drive API,
 * then renders it via an object URL. Results are cached module-level so
 * each file is only fetched once per session.
 *
 * This is the only approach that reliably works for Drive-stored images
 * regardless of sharing settings or Google's URL restrictions.
 */
import { useState, useEffect } from 'react';
import { getValidAccessToken } from '../../services/authService';

// Module-level cache: fileId → object URL (survives re-renders)
const _cache = new Map<string, string>();
// In-flight promises so parallel components share one fetch
const _inflight = new Map<string, Promise<string>>();

async function fetchDriveImageUrl(fileId: string): Promise<string> {
  if (_cache.has(fileId)) return _cache.get(fileId)!;
  if (_inflight.has(fileId)) return _inflight.get(fileId)!;

  const promise = (async () => {
    const token = await getValidAccessToken();
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Drive fetch ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    _cache.set(fileId, url);
    _inflight.delete(fileId);
    return url;
  })();

  _inflight.set(fileId, promise);
  promise.catch(() => _inflight.delete(fileId));
  return promise;
}

interface DriveImageProps {
  fileId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function DriveImage({ fileId, alt = '', className, onClick }: DriveImageProps) {
  const [src, setSrc] = useState<string | null>(_cache.get(fileId) ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (_cache.has(fileId)) {
      setSrc(_cache.get(fileId)!);
      return;
    }
    setError(false);
    fetchDriveImageUrl(fileId)
      .then(url => { if (!cancelled) setSrc(url); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [fileId]);

  if (error) {
    return (
      <div className={`drive-img drive-img--error ${className ?? ''}`} title="Failed to load">
        ⚠️
      </div>
    );
  }

  if (!src) {
    return <div className={`drive-img drive-img--loading ${className ?? ''}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
    />
  );
}

/** Purge a file from the cache (call after deleting an image from Drive) */
export function evictDriveImageCache(fileId: string) {
  const url = _cache.get(fileId);
  if (url) URL.revokeObjectURL(url);
  _cache.delete(fileId);
}
