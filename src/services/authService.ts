/**
 * authService.ts
 *
 * Calls Google's token endpoint directly — no backend needed.
 * GOOGLE_CLIENT_SECRET lives in VITE_GOOGLE_CLIENT_SECRET (Vercel env var).
 */

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STORAGE_KEYS } from '../config';
import type { TokenSet } from '../types';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// In-memory access token (never persisted to localStorage)
let _accessToken: string | null = null;
let _expiresAt: number | null = null;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function saveRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

function loadRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);
  _accessToken = null;
  _expiresAt = null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isAccessTokenValid(): boolean {
  if (!_accessToken || !_expiresAt) return false;
  return Date.now() < _expiresAt - 60_000; // 1-min buffer
}

function storeTokenSet(tokens: TokenSet): void {
  _accessToken = tokens.accessToken;
  _expiresAt = tokens.expiresAt;
  if (tokens.refreshToken) saveRefreshToken(tokens.refreshToken);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exchange a Google OAuth authorization code for access + refresh tokens.
 * Calls Google's token endpoint directly (no backend).
 */
export async function exchangeCode(code: string): Promise<TokenSet> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);

  const tokens: TokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeTokenSet(tokens);
  return tokens;
}

/**
 * Use the stored refresh token to silently get a new access token.
 * Calls Google's token endpoint directly (no backend).
 */
export async function refreshAccessToken(): Promise<TokenSet> {
  const refreshToken = loadRefreshToken();
  if (!refreshToken) throw new Error('No refresh token — user must sign in');

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.error) {
    clearStoredTokens();
    throw new Error(data.error_description ?? data.error);
  }

  const tokens: TokenSet = {
    accessToken: data.access_token,
    refreshToken: null, // Google doesn't rotate refresh tokens here
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeTokenSet(tokens);
  return tokens;
}

/**
 * Returns a valid access token, refreshing silently if necessary.
 */
export async function getValidAccessToken(): Promise<string> {
  if (isAccessTokenValid()) return _accessToken!;
  const tokens = await refreshAccessToken();
  return tokens.accessToken;
}

/** True if user has previously signed in (refresh token in localStorage). */
export function hasStoredSession(): boolean {
  return !!loadRefreshToken();
}

/** Sign out — clears all stored tokens. */
export function signOut(): void {
  clearStoredTokens();
}
