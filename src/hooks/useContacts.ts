/**
 * useContacts.ts
 *
 * Firebase Firestore & ImageKit integration.
 * Manages the contacts list and configuration, scoping everything under the active userId.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToContacts,
  saveContactDoc,
  deleteContactDoc,
  fetchConfigDoc,
  saveConfigDoc,
  poolContactsDocs,
  depoolContactsDocs,
} from '../services/firebaseService';
import { uploadToImageKit, deleteFromImageKit } from '../services/imagekitService';
import { recomputeTiers } from '../utils/tierUtils';
import { generateId } from '../utils/uuid';
import { compressImage } from '../utils/imageCompressor';
import type { Contact, AppConfig } from '../types';
import { DEFAULT_AGE_TYPES, DEFAULT_TIER_BOUNDARIES } from '../types';

interface UseContactsReturn {
  contacts: Contact[];
  config: AppConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  addContact: (draft: ContactDraft, imageFiles: File[]) => Promise<void>;
  updateContact: (
    id: string,
    draft: ContactDraft,
    newImageFiles: File[],
    removedImageIds: string[]
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  updateConfig: (config: AppConfig) => Promise<void>;
  poolContacts: (contactIds: string[]) => Promise<void>;
  depoolContacts: (contactIds: string[]) => Promise<void>;
}

export type ContactDraft = Omit<
  Contact,
  'id' | 'imageFileIds' | 'imageUrls' | 'imageKitIds' | 'createdAt' | 'updatedAt'
>;

const DEFAULT_CONFIG: AppConfig = {
  ageTypes: DEFAULT_AGE_TYPES,
  tierBoundaries: DEFAULT_TIER_BOUNDARIES,
};

export function useContacts(userId: string | null): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Sync contacts and config on userId change ──────────────────────────────
  useEffect(() => {
    if (!userId) {
      setContacts([]);
      setConfig(DEFAULT_CONFIG);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Fetch Config
    fetchConfigDoc(userId)
      .then(async (userConfig) => {
        if (userConfig) {
          setConfig(userConfig);
        } else {
          // If no user config exists yet, initialize with default config
          await saveConfigDoc(userId, DEFAULT_CONFIG);
          setConfig(DEFAULT_CONFIG);
        }
      })
      .catch((err) => {
        console.error('Failed to load user config:', err);
        setError('Failed to load settings.');
      });

    // 2. Subscribe to contacts
    const unsubscribe = subscribeToContacts(
      userId,
      (updatedContacts) => {
        setContacts(updatedContacts);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to sync contacts:', err);
        setError(err.message ?? 'Failed to sync contacts.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // ── Image upload helper ────────────────────────────────────────────────────
  const uploadImages = useCallback(async (files: File[]): Promise<{ fileId: string; url: string }[]> => {
    return Promise.all(
      files.map(async (file) => {
        let uploadData: File | Blob = file;
        try {
          uploadData = await compressImage(file);
        } catch (err) {
          console.warn('Failed to compress image, uploading original instead:', err);
        }
        // Create a unique file name to avoid collisions
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_${cleanName}`;
        return uploadToImageKit(uploadData, fileName);
      })
    );
  }, []);

  // ── addContact ─────────────────────────────────────────────────────────────
  const addContact = useCallback(
    async (draft: ContactDraft, imageFiles: File[]) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        const uploaded = await uploadImages(imageFiles);
        const imageUrls = uploaded.map((u) => u.url);
        const imageKitIds = uploaded.map((u) => u.fileId);

        const now = new Date().toISOString();
        const contact: Contact = {
          ...draft,
          id: generateId(),
          imageFileIds: [], // Empty for new Firebase-native contacts
          imageUrls,
          imageKitIds,
          priceType: draft.priceType,
          createdAt: now,
          updatedAt: now,
        };

        await saveContactDoc(userId, contact);
      } catch (err: any) {
        console.error('Failed to add contact:', err);
        setError(err.message ?? 'Failed to add contact.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, uploadImages]
  );

  // ── updateContact ──────────────────────────────────────────────────────────
  const updateContact = useCallback(
    async (
      id: string,
      draft: ContactDraft,
      newImageFiles: File[],
      removedImageIds: string[]
    ) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        // Find existing contact
        const existing = contacts.find((c) => c.id === id);
        if (!existing) throw new Error('Contact not found');

        // Delete removed ImageKit images from CDN
        const existingKitIds = existing.imageKitIds ?? [];
        const imageKitDeletes = removedImageIds.filter((imgId) =>
          existingKitIds.includes(imgId)
        );
        await Promise.all(
          imageKitDeletes.map((kitId) => deleteFromImageKit(kitId).catch(console.warn))
        );

        // Upload new images to ImageKit
        const newUploaded = await uploadImages(newImageFiles);

        // Compute next lists of images
        const nextImageUrls = (existing.imageUrls ?? []).filter((_, idx) => {
          const kitId = existing.imageKitIds?.[idx];
          const driveId = existing.imageFileIds?.[idx];
          // Keep if the corresponding ID was not removed
          return (
            (kitId && !removedImageIds.includes(kitId)) ||
            (driveId && !removedImageIds.includes(driveId))
          );
        });

        const nextImageKitIds = existingKitIds.filter((kitId) => !removedImageIds.includes(kitId));
        const nextImageFileIds = (existing.imageFileIds ?? []).filter(
          (driveId) => !removedImageIds.includes(driveId)
        );

        // Append new images
        newUploaded.forEach((u) => {
          nextImageUrls.push(u.url);
          nextImageKitIds.push(u.fileId);
        });

        const updated: Contact = {
          ...existing,
          ...draft,
          imageFileIds: nextImageFileIds,
          imageUrls: nextImageUrls,
          imageKitIds: nextImageKitIds,
          priceType: draft.priceType,
          updatedAt: new Date().toISOString(),
        };

        await saveContactDoc(userId, updated);
      } catch (err: any) {
        console.error('Failed to update contact:', err);
        setError(err.message ?? 'Failed to update contact.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, contacts, uploadImages]
  );

  // ── deleteContact ──────────────────────────────────────────────────────────
  const deleteContact = useCallback(
    async (id: string) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        const contact = contacts.find((c) => c.id === id);
        if (contact) {
          // Delete ImageKit photos
          const kitIds = contact.imageKitIds ?? [];
          if (kitIds.length > 0) {
            await Promise.all(
              kitIds.map((kitId) => deleteFromImageKit(kitId).catch(console.warn))
            );
          }
        }
        await deleteContactDoc(userId, id);
      } catch (err: any) {
        console.error('Failed to delete contact:', err);
        setError(err.message ?? 'Failed to delete contact.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, contacts]
  );

  // ── updateConfig ───────────────────────────────────────────────────────────
  const updateConfig = useCallback(
    async (newConfig: AppConfig) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        // Save the new config document to Firestore
        await saveConfigDoc(userId, newConfig);
        setConfig(newConfig);

        // Recompute tiers for all local contacts and push updates
        const updatedContacts = recomputeTiers(contacts, newConfig.tierBoundaries);
        await Promise.all(
          updatedContacts.map((c) => saveContactDoc(userId, c))
        );
      } catch (err: any) {
        console.error('Failed to update settings:', err);
        setError(err.message ?? 'Failed to update settings.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, contacts]
  );

  // ── poolContacts ──────────────────────────────────────────────────────────
  const poolContacts = useCallback(
    async (contactIds: string[]) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        const contactsToPool = contacts.filter((c) => contactIds.includes(c.id));
        await poolContactsDocs(userId, contactsToPool);
      } catch (err: any) {
        console.error('Failed to pool contacts:', err);
        setError(err.message ?? 'Failed to pool contacts.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, contacts]
  );

  // ── depoolContacts ────────────────────────────────────────────────────────
  const depoolContacts = useCallback(
    async (contactIds: string[]) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        await depoolContactsDocs(userId, contactIds);
      } catch (err: any) {
        console.error('Failed to depool contacts:', err);
        setError(err.message ?? 'Failed to depool contacts.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId]
  );

  return {
    contacts,
    config,
    isLoading,
    isSaving,
    error,
    addContact,
    updateContact,
    deleteContact,
    updateConfig,
    poolContacts,
    depoolContacts,
  };
}
