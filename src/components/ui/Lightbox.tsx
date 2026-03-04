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
      {/* Header: Counter (center) + Close (right) */}
      <div className="lightbox__header" onClick={(e) => e.stopPropagation()}>
        {count > 1 ? (
          <div className="lightbox__counter">
            {index + 1} / {count}
          </div>
        ) : <div />}
        <button className="lightbox__close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="lightbox__content">
        {count > 1 && (
          <div
            className="lightbox__nav-zone lightbox__nav-zone--left"
            onClick={(e) => { e.stopPropagation(); setIndex(i => (i - 1 + count) % count); }}
            aria-label="Previous image"
          />
        )}

        <DriveImage
          fileId={fileIds[index]}
          alt={`Image ${index + 1} of ${count}`}
          className="lightbox__img"
          size="s2000"
        />

        {count > 1 && (
          <div
            className="lightbox__nav-zone lightbox__nav-zone--right"
            onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % count); }}
            aria-label="Next image"
          />
        )}
      </div>
    </div>,
    document.body
  );
}
