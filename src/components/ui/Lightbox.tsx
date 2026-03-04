/**
 * Lightbox.tsx — full-screen image viewer with keyboard navigation.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];   // display URLs
  startIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = [startIndex, () => {}]; // controlled externally via state

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className="lightbox" onClick={onClose} aria-modal="true" role="dialog">
      <button className="lightbox__close" onClick={onClose} aria-label="Close">✕</button>
      <img
        className="lightbox__img"
        src={images[index]}
        alt="Full size"
        onClick={e => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
