/**
 * useAuth.ts
 *
 * Hook that manages the full auth lifecycle:
 *   - Silently restores session from stored refresh token on mount
 *   - Exposes login handler (triggers Google consent popup, auth-code flow)
 *   - Exposes logout handler
 *   - Exposes the current access token for services to consume
 */

import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  exchangeCode,
  refreshAccessToken,
  hasStoredSession,
  signOut as clearTokens,
} from '../services/authService';
import { initGapiClient, getOrCreateAppFolder } from '../services/driveService';
import { GOOGLE_SCOPES } from '../config';
import type { AuthState } from '../types';

interface UseAuthReturn extends AuthState {
  appFolderId: string | null;
  login: () => void;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    error: null,
  });
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  // ── Connect to Drive after we have a valid access token ──────────────────
  const connectDrive = useCallback(async (accessToken: string) => {
    await initGapiClient(accessToken);
    const folderId = await getOrCreateAppFolder();
    setAppFolderId(folderId);
    setState({
      isAuthenticated: true,
      isLoading: false,
      accessToken,
      error: null,
    });
  }, []);

  // ── Silent restore on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!hasStoredSession()) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    refreshAccessToken()
      .then(tokens => connectDrive(tokens.accessToken))
      .catch(err => {
        console.error('Silent restore failed:', err);
        setState({
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          error: 'Session expired. Please sign in again.',
        });
      });
  }, [connectDrive]);

  // ── Login via Google auth-code flow ──────────────────────────────────────
  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    scope: GOOGLE_SCOPES,
    // @ts-expect-error - 'prompt' is passed down to Google Identity Services but is missing in the @react-oauth/google types
    prompt: 'select_account', // Forces the account selection screen
    onSuccess: async ({ code }) => {
      setState(s => ({ ...s, isLoading: true, error: null }));
      try {
        const tokens = await exchangeCode(code);
        await connectDrive(tokens.accessToken);
      } catch (err: any) {
        setState(s => ({
          ...s,
          isLoading: false,
          error: err.message ?? 'Authentication failed',
        }));
      }
    },
    onError: (err) => {
      setState(s => ({
        ...s,
        isLoading: false,
        error: (err as any).error_description ?? 'Login cancelled',
      }));
    },
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearTokens();
    setAppFolderId(null);
    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    appFolderId,
    login: loginWithGoogle,
    logout,
  };
}
