/**
 * ContactImage.tsx
 *
 * Renders contact images.
 * Supports both modern direct CDN URLs (from ImageKit) and legacy Google Drive file IDs.
 * Automatically applies ImageKit CDN real-time image optimization and resizing.
 */

interface ContactImageProps {
  url?: string;
  fileId?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  size?: 's800' | 's1200' | 's2000';
}

export function ContactImage({
  url,
  fileId,
  alt = '',
  className,
  onClick,
  size = 's800',
}: ContactImageProps) {
  // If we have a direct CDN URL (ImageKit), apply real-time optimizations and render
  if (url) {
    let optimizedUrl = url;
    
    // Append ImageKit URL transformations based on requested size
    if (url.includes('imagekit.io')) {
      const separator = url.includes('?') ? '&' : '?';
      if (size === 's800') {
        // Compact card thumbnails (~90px display size): load a 250px compressed version
        optimizedUrl = `${url}${separator}tr=w-250,h-250,fo-auto,q-80`;
      } else if (size === 's1200') {
        // Standard view / carousel: load a 600px version
        optimizedUrl = `${url}${separator}tr=w-600,h-600,fo-auto,q-80`;
      } else if (size === 's2000') {
        // Fullscreen lightboxes: load a high-quality 1200px version
        optimizedUrl = `${url}${separator}tr=w-1200,q-85`;
      }
    }

    return (
      <img
        src={optimizedUrl}
        alt={alt}
        className={`contact-img ${className ?? ''}`}
        onClick={onClick}
        loading="lazy"
      />
    );
  }

  // Fallback to legacy Google Drive thumbnail if we only have a Drive file ID
  if (fileId) {
    const driveThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
    return (
      <img
        src={driveThumbnailUrl}
        alt={alt}
        className={`contact-img ${className ?? ''}`}
        onClick={onClick}
        loading="lazy"
      />
    );
  }

  // Fallback placeholder if no image exists
  return (
    <div
      className={`contact-img contact-img--placeholder ${className ?? ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
        fontSize: '1.5rem',
      }}
      onClick={onClick}
    >
      👤
    </div>
  );
}
