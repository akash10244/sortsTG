/**
 * DriveImage.tsx
 *
 * Renders an image using the Drive thumbnail API.
 * This relies on files being publicly readable (which they are, via makeFilePublic).
 * It delegates completely to the browser's native lazy loading and caching.
 */
import { driveImageUrl } from '../../services/driveService';

interface DriveImageProps {
  fileId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  size?: 's800' | 's1200' | 's2000';
}

export function DriveImage({ fileId, alt = '', className, onClick, size = 's800' }: DriveImageProps) {
  return (
    <img
      src={driveImageUrl(fileId, size)}
      alt={alt}
      className={`drive-img ${className ?? ''}`}
      onClick={onClick}
      loading="lazy"
    />
  );
}

/** No-op now, kept for backwards compatibility if called elsewhere */
export function evictDriveImageCache(_fileId: string) {
  // Browser disk native cache handles this
}
