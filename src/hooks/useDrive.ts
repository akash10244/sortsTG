/**
 * useDrive.ts
 *
 * Given the app folder ID (from useAuth), initialises the images sub-folder
 * and exposes both folder IDs to the rest of the app.
 */

import { useState, useEffect } from 'react';
import { getOrCreateSubFolder } from '../services/driveService';
import { IMAGES_SUBFOLDER_NAME } from '../config';

interface UseDriveReturn {
  imagesFolderId: string | null;
  isDriveReady: boolean;
  driveError: string | null;
}

export function useDrive(appFolderId: string | null): UseDriveReturn {
  const [imagesFolderId, setImagesFolderId] = useState<string | null>(null);
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  useEffect(() => {
    if (!appFolderId) return;

    let cancelled = false;
    setIsDriveReady(false);
    setDriveError(null);

    getOrCreateSubFolder(IMAGES_SUBFOLDER_NAME, appFolderId)
      .then((id) => {
        if (cancelled) return;
        setImagesFolderId(id);
        setIsDriveReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('useDrive: failed to init images folder:', err);
        setDriveError(err.message ?? 'Failed to initialise Drive storage');
      });

    return () => { cancelled = true; };
  }, [appFolderId]);

  return { imagesFolderId, isDriveReady, driveError };
}
