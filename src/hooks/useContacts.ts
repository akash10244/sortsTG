/**
 * useContacts.ts
 *
 * Central state for contacts + app config.
 * All mutations optimistically update local state then persist to Drive.
 */

import { useState, useEffect, useCallback } from 'react';
import { loadData, saveData } from '../services/contactService';
import { deleteFile, uploadFile, makeFilePublic } from '../services/driveService';
import { deriveTier, recomputeTiers, minPrice } from '../utils/tierUtils';
import { generateId } from '../utils/uuid';
import type { Contact, AppConfig, DriveDataFile } from '../types';

interface UseContactsReturn {
  contacts: Contact[];
  config: AppConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  addContact: (draft: ContactDraft, imageFiles: File[], imagesFolderId: string) => Promise<void>;
  updateContact: (id: string, draft: ContactDraft, newImageFiles: File[], removedFileIds: string[], imagesFolderId: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  updateConfig: (config: AppConfig) => Promise<void>;
}

/** The raw form data before IDs / timestamps are generated */
export type ContactDraft = Omit<Contact, 'id' | 'priceType' | 'imageFileIds' | 'createdAt' | 'updatedAt'>;

export function useContacts(appFolderId: string | null): UseContactsReturn {
  const [data, setData] = useState<DriveDataFile>({ contacts: [], config: { ageTypes: [], tierBoundaries: { midrangeMin: 7000, premiumMin: 13000, modelsMin: 18000 } } });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appFolderId) return;
    setIsLoading(true);
    setError(null);
    loadData(appFolderId)
      .then(setData)
      .catch((err) => setError(err.message ?? 'Failed to load contacts'))
      .finally(() => setIsLoading(false));
  }, [appFolderId]);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback(async (next: DriveDataFile) => {
    if (!appFolderId) return;
    setIsSaving(true);
    try {
      await saveData(next, appFolderId);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [appFolderId]);

  // ── Image upload helper ────────────────────────────────────────────────────
  const uploadImages = useCallback(async (files: File[], imagesFolderId: string): Promise<string[]> => {
    const ids: string[] = [];
    for (const file of files) {
      const result = await uploadFile(file, imagesFolderId);
      await makeFilePublic(result.id);
      ids.push(result.id);
    }
    return ids;
  }, []);

  // ── addContact ─────────────────────────────────────────────────────────────
  const addContact = useCallback(async (
    draft: ContactDraft,
    imageFiles: File[],
    imagesFolderId: string
  ) => {
    const imageFileIds = await uploadImages(imageFiles, imagesFolderId);
    const now = new Date().toISOString();
    const contact: Contact = {
      ...draft,
      id: generateId(),
      imageFileIds,
      priceType: deriveTier(minPrice(draft.prices), data.config.tierBoundaries),
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...data, contacts: [...data.contacts, contact] };
    setData(next);
    await persist(next);
  }, [data, uploadImages, persist]);

  // ── updateContact ──────────────────────────────────────────────────────────
  const updateContact = useCallback(async (
    id: string,
    draft: ContactDraft,
    newImageFiles: File[],
    removedFileIds: string[],
    imagesFolderId: string
  ) => {
    // Delete removed images from Drive
    await Promise.all(removedFileIds.map(deleteFile));

    // Upload new images
    const newIds = await uploadImages(newImageFiles, imagesFolderId);

    const existing = data.contacts.find(c => c.id === id);
    if (!existing) return;

    const keptIds = existing.imageFileIds.filter(fid => !removedFileIds.includes(fid));
    const updated: Contact = {
      ...existing,
      ...draft,
      imageFileIds: [...keptIds, ...newIds],
      priceType: deriveTier(minPrice(draft.prices), data.config.tierBoundaries),
      updatedAt: new Date().toISOString(),
    };

    const next = {
      ...data,
      contacts: data.contacts.map(c => (c.id === id ? updated : c)),
    };
    setData(next);
    await persist(next);
  }, [data, uploadImages, persist]);

  // ── deleteContact ──────────────────────────────────────────────────────────
  const deleteContact = useCallback(async (id: string) => {
    const contact = data.contacts.find(c => c.id === id);
    // Delete Drive images (fire-and-forget soft failures)
    if (contact?.imageFileIds.length) {
      await Promise.all(contact.imageFileIds.map(fid => deleteFile(fid).catch(console.warn)));
    }
    const next = { ...data, contacts: data.contacts.filter(c => c.id !== id) };
    setData(next);
    await persist(next);
  }, [data, persist]);

  // ── updateConfig ───────────────────────────────────────────────────────────
  const updateConfig = useCallback(async (config: AppConfig) => {
    // Re-derive all tiers if boundaries changed
    const contacts = recomputeTiers(data.contacts, config.tierBoundaries);
    const next = { contacts, config };
    setData(next);
    await persist(next);
  }, [data, persist]);

  return {
    contacts: data.contacts,
    config: data.config,
    isLoading,
    isSaving,
    error,
    addContact,
    updateContact,
    deleteContact,
    updateConfig,
  };
}
