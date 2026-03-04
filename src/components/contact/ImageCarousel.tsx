/**
 * ImageCarousel.tsx — swipeable image gallery with dot indicators and lightbox.
 * Uses DriveImage for auth-based fetching instead of public URLs.
 */
import { useState } from 'react';
import { DriveImage } from '../ui/DriveImage';
import { Lightbox } from '../ui/Lightbox';

interface ImageCarouselProps {
  fileIds: string[];
}

export function ImageCarousel({ fileIds }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const count = fileIds.length;

  if (count === 0) {
    return (
      <div className="carousel carousel--empty">
        <span className="carousel__placeholder">👤</span>
      </div>
    );
  }

  const prev = () => setCurrent(i => (i - 1 + count) % count);
  const next = () => setCurrent(i => (i + 1) % count);

  return (
    <>
      <div className="carousel">
        <DriveImage
          fileId={fileIds[current]}
          alt={`Photo ${current + 1}`}
          className="carousel__img"
          onClick={() => setLightboxOpen(true)}
        />
        {count > 1 && (
          <>
            <button className="carousel__nav carousel__nav--prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
            <button className="carousel__nav carousel__nav--next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
            <div className="carousel__dots">
              {fileIds.map((_, i) => (
                <button
                  key={i}
                  className={`carousel__dot ${i === current ? 'carousel__dot--active' : ''}`}
                  onClick={e => { e.stopPropagation(); setCurrent(i); }}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {lightboxOpen && (
        <Lightbox fileIds={fileIds} startIndex={current} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
