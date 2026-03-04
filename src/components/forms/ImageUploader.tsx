/**
 * ImageUploader.tsx — multi-file image picker with per-file upload progress.
 * Files are not uploaded immediately; they are queued and the parent component
 * calls uploadImages() from useContacts when saving the contact form.
 */
import { useState, useCallback } from 'react';
import { driveImageUrl } from '../../services/driveService';
import { Spinner } from '../ui/Spinner';

interface PendingImage {
  file: File;
  preview: string; // object URL for preview
}

interface ImageUploaderProps {
  /** Existing Drive file IDs (on edit mode) */
  existingFileIds: string[];
  /** Called when user removes an existing image */
  onRemoveExisting: (fileId: string) => void;
  /** Queue of new files chosen by user */
  pendingFiles: PendingImage[];
  onPendingChange: (files: PendingImage[]) => void;
  uploading?: boolean;
}

export function ImageUploader({
  existingFileIds,
  onRemoveExisting,
  pendingFiles,
  onPendingChange,
  uploading = false,
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
      {existingFileIds.map(id => (
        <div key={id} className="image-uploader__thumb">
          <img src={driveImageUrl(id)} alt="Existing" />
          <button
            className="image-uploader__remove"
            type="button"
            onClick={() => onRemoveExisting(id)}
            aria-label="Remove image"
          >
            ✕
          </button>
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
      {!uploading && (
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
