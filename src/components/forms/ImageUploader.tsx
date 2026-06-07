/**
 * ImageUploader.tsx — multi-file image picker with previews.
 * Supporting both ImageKit direct CDN URLs and legacy Drive file IDs.
 */
import { useCallback } from 'react';
import { ContactImage } from '../ui/ContactImage';
import { Spinner } from '../ui/Spinner';

export interface ExistingImage {
  id: string; // Unique identifier (ImageKit file ID or Google Drive file ID)
  url?: string; // ImageKit CDN URL
  fileId?: string; // Google Drive file ID
}

interface PendingImage {
  file: File;
  preview: string; // object URL for preview
}

interface ImageUploaderProps {
  /** Existing images (ImageKit or Drive) */
  existingImages: ExistingImage[];
  /** Called when user removes an existing image */
  onRemoveExisting: (id: string) => void;
  /** Queue of new files chosen by user */
  pendingFiles: PendingImage[];
  onPendingChange: (files: PendingImage[]) => void;
  uploading?: boolean;
  readOnly?: boolean;
}

export function ImageUploader({
  existingImages,
  onRemoveExisting,
  pendingFiles,
  onPendingChange,
  uploading = false,
  readOnly = false,
}: ImageUploaderProps) {
  const handlePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPending: PendingImage[] = files.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    onPendingChange([...pendingFiles, ...newPending]);
    e.target.value = ''; // reset input so same file can be re-picked
  }, [pendingFiles, onPendingChange]);

  const removePending = (idx: number) => {
    const next = [...pendingFiles];
    URL.revokeObjectURL(next[idx].preview);
    next.splice(idx, 1);
    onPendingChange(next);
  };

  return (
    <div className="image-uploader">
      {/* Existing images */}
      {existingImages.map(img => (
        <div key={img.id} className="image-uploader__thumb">
          <ContactImage url={img.url} fileId={img.fileId} alt="Existing" className="image-uploader__thumb-img" />
          {!readOnly && (
            <button
              className="image-uploader__remove"
              type="button"
              onClick={() => onRemoveExisting(img.id)}
              aria-label="Remove image"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Pending new images */}
      {pendingFiles.map((p, i) => (
        <div key={i} className="image-uploader__thumb image-uploader__thumb--pending">
          <img src={p.preview} alt={`New ${i + 1}`} />
          {uploading ? (
            <div className="image-uploader__overlay">
              <Spinner size="sm" />
            </div>
          ) : (
            <button
              className="image-uploader__remove"
              type="button"
              onClick={() => removePending(i)}
              aria-label="Remove image"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Add button */}
      {!uploading && !readOnly && (
        <label className="image-uploader__add">
          <span>＋ Add photo</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePick}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}

export type { PendingImage };
