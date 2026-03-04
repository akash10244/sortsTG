/**
 * Lightbox.tsx — full-screen image viewer with keyboard navigation.
 * Uses DriveImage for auth-based fetching.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DriveImage } from './DriveImage';

interface LightboxProps {
  fileIds: string[];
  startIndex: number;
  onClose: () => void;
}

export function Lightbox({ fileIds, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const count = fileIds.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIndex(i => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % count);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, count]);

  return createPortal(
    <div className="lightbox" onClick={onClose} aria-modal="true" role="dialog">
      <button className="lightbox__close" onClick={onClose} aria-label="Close">✕</button>
      {count > 1 && (
        <>
          <button className="lightbox__nav lightbox__nav--prev" onClick={e => { e.stopPropagation(); setIndex(i => (i - 1 + count) % count); }} aria-label="Previous">‹</button>
          <button className="lightbox__nav lightbox__nav--next" onClick={e => { e.stopPropagation(); setIndex(i => (i + 1) % count); }} aria-label="Next">›</button>
        </>
      )}
      <DriveImage
        fileId={fileIds[index]}
        alt="Full size"
        className="lightbox__img"
      />
      {count > 1 && (
        <div className="lightbox__counter">{index + 1} / {count}</div>
      )}
    </div>,
    document.body
  );
}
