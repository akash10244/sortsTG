// ─── Application-level constants ────────────────────────────────────────────

export const GOOGLE_CLIENT_ID =
  '264697566403-6red5l11d38rcon95bg5une162aplu58.apps.googleusercontent.com';

/** Full Drive read/write scope */
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive';

/** The local Express auth server */
export const AUTH_SERVER_URL = 'http://localhost:3001';

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
