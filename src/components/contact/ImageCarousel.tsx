/**
 * ImageCarousel.tsx — gallery with dot indicators and lightbox.
 * Uses ContactImage to support both ImageKit URLs and legacy Drive file IDs.
 */
import { useState } from 'react';
import { ContactImage } from '../ui/ContactImage';
import { Lightbox } from '../ui/Lightbox';

interface ImageCarouselProps {
  imageUrls?: string[];
  fileIds?: string[];
}

export function ImageCarousel({ imageUrls = [], fileIds = [] }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasUrls = imageUrls.length > 0;
  const activeUrls = hasUrls ? imageUrls : [];
  const activeDriveIds = hasUrls ? [] : fileIds;
  const count = activeUrls.length + activeDriveIds.length;

  if (count === 0) {
    return (
      <div className="carousel carousel--empty">
        <span className="carousel__placeholder">👤</span>
      </div>
    );
  }

  const prev = () => setCurrent(i => (i - 1 + count) % count);
  const next = () => setCurrent(i => (i + 1) % count);

  const isUrl = current < activeUrls.length;
  const currentUrl = isUrl ? activeUrls[current] : undefined;
  const currentFileId = isUrl ? undefined : activeDriveIds[current - activeUrls.length];

  return (
    <>
      <div className="carousel">
        <ContactImage
          url={currentUrl}
          fileId={currentFileId}
          alt={`Photo ${current + 1}`}
          className="carousel__img"
          onClick={() => setLightboxOpen(true)}
        />
        {count > 1 && (
          <>
            <button className="carousel__nav carousel__nav--prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
            <button className="carousel__nav carousel__nav--next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
            <div className="carousel__dots">
              {Array.from({ length: count }).map((_, i) => (
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
        <Lightbox
          imageUrls={activeUrls}
          fileIds={activeDriveIds}
          startIndex={current}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
