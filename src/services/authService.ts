/**
 * authService.ts
 *
 * Handles all token lifecycle management:
 *   - Exchanging an auth code for access + refresh tokens (via local server)
 *   - Refreshing an expired access token (via local server)
 *   - Persisting the refresh token in localStorage
 *   - Checking token expiry
 */

import { AUTH_SERVER_URL, STORAGE_KEYS } from '../config';
import type { TokenSet } from '../types';

// In-memory access token (never persisted to localStorage for security)
let _accessToken: string | null = null;
let _expiresAt: number | null = null;

// ─── Storage helpers ─────────────────────────────────────────────────────────

function saveRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

function loadRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

function clearStoredTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES);
  _accessToken = null;
  _expiresAt = null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isAccessTokenValid(): boolean {
  if (!_accessToken || !_expiresAt) return false;
  // Consider expired 60 seconds before actual expiry to avoid edge cases
  return Date.now() < _expiresAt - 60_000;
}

function storeTokenSet(tokens: TokenSet): void {
  _accessToken = tokens.accessToken;
  _expiresAt = tokens.expiresAt;
  if (tokens.refreshToken) {
    saveRefreshToken(tokens.refreshToken);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exchange a Google OAuth authorization code for access + refresh tokens.
 * Called once after the user completes the sign-in popup.
 */
export async function exchangeCode(code: string): Promise<TokenSet> {
  const res = await fetch(`${AUTH_SERVER_URL}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Code exchange failed');

  const tokens: TokenSet = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
  storeTokenSet(tokens);
  return tokens;
}

/**
 * Use the stored refresh token to silently obtain a new access token.
 * Throws if there is no stored refresh token.
 */
export async function refreshAccessToken(): Promise<TokenSet> {
  const refreshToken = loadRefreshToken();
  if (!refreshToken) throw new Error('No refresh token stored — user must sign in');

  const res = await fetch(`${AUTH_SERVER_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    clearStoredTokens();
    throw new Error(data.error ?? 'Token refresh failed');
  }

  const tokens: TokenSet = {
    accessToken: data.accessToken,
    refreshToken: null, // refresh tokens don't rotate here
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
  storeTokenSet(tokens);
  return tokens;
}

/**
 * Returns a valid access token, refreshing silently if necessary.
 * This is the primary entry-point for services that need an access token.
 */
export async function getValidAccessToken(): Promise<string> {
  if (isAccessTokenValid()) return _accessToken!;
  const tokens = await refreshAccessToken();
  return tokens.accessToken;
}

/**
 * True if we have a refresh token stored (i.e. user has previously signed in).
 */
export function hasStoredSession(): boolean {
  return !!loadRefreshToken();
}

/**
 * Sign out — clears all stored tokens.
 */
export function signOut(): void {
  clearStoredTokens();
}
