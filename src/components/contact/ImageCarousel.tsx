/**
 * ImageCarousel.tsx — swipeable image gallery with dot indicators and lightbox.
 */
import { useState } from 'react';
import { driveImageUrl } from '../../services/driveService';
import { Lightbox } from '../ui/Lightbox';

interface ImageCarouselProps {
  fileIds: string[];
}

export function ImageCarousel({ fileIds }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const urls = fileIds.map(id => driveImageUrl(id, 's800'));
  const lightboxUrls = fileIds.map(id => driveImageUrl(id, 's2000'));
  const count = urls.length;

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
        <img
          className="carousel__img"
          src={urls[current]}
          alt={`Photo ${current + 1}`}
          onClick={() => setLightboxOpen(true)}
          loading="lazy"
        />
        {count > 1 && (
          <>
            <button className="carousel__nav carousel__nav--prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
            <button className="carousel__nav carousel__nav--next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
            <div className="carousel__dots">
              {urls.map((_, i) => (
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
        <Lightbox images={lightboxUrls} startIndex={current} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
