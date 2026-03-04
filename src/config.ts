// ─── Application-level constants ────────────────────────────────────────────

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/** Full Drive read/write scope */
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive';

export const AUTH_SERVER_URL =
  import.meta.env.VITE_AUTH_SERVER_URL ?? 'http://localhost:3001';

/**
 * Google OAuth client secret — set VITE_GOOGLE_CLIENT_SECRET in Vercel env vars.
 * Yes, it ends up in the JS bundle. Fine for a personal app.
 */
export const GOOGLE_CLIENT_SECRET =
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '';

/** Folder path inside Google Drive where all app data lives */
export const DRIVE_FOLDER_PATH = 'projects/sortsTG';

/** Sub-folder inside the app folder where contact images are stored */
export const IMAGES_SUBFOLDER_NAME = 'images';

/** Filename for the main data JSON stored in the app folder */
export const DATA_FILENAME = 'contacts.json';

/** localStorage keys */
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'app_refresh_token',
  ACCESS_TOKEN_EXPIRES: 'app_token_expires_at',
} as const;
