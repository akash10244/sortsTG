/**
 * BottomSheet.tsx — mobile-friendly sheet that slides up from the bottom.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="bs-overlay" onClick={onClose}>
      <div className="bs" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="bs__handle" />
        {title && (
          <div className="bs__header">
            <span className="bs__title">{title}</span>
          </div>
        )}
        <div className="bs__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
