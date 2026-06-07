/**
 * useAuth.ts
 *
 * Firebase Auth integration. Manages the user session lifecycle and
 * Google Provider credentials.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../services/firebaseService';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: User | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message ?? 'Authentication state error');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Login via Google Popup
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setUser(result.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message ?? 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fbSignOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message ?? 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated: !!user,
    isLoading,
    userId: user?.uid ?? null,
    user,
    error,
    login,
    logout,
  };
}
