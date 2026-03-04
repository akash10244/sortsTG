/**
 * contactService.ts
 *
 * Thin data-access layer: loads and saves the contacts.json file on Drive.
 * All business logic (CRUD, tier computation) lives in the useContacts hook.
 */

import { loadJson, saveJson } from './driveService';
import { DATA_FILENAME } from '../config';
import { DEFAULT_AGE_TYPES, DEFAULT_TIER_BOUNDARIES } from '../types';
import type { DriveDataFile, AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  ageTypes: DEFAULT_AGE_TYPES,
  tierBoundaries: DEFAULT_TIER_BOUNDARIES,
};

const EMPTY_DATA: DriveDataFile = {
  contacts: [],
  config: DEFAULT_CONFIG,
};

/**
 * Load the full data file from Drive.
 * Returns sensible defaults if the file doesn't exist yet.
 */
export async function loadData(appFolderId: string): Promise<DriveDataFile> {
  const data = await loadJson<DriveDataFile>(DATA_FILENAME, appFolderId);
  if (!data) return EMPTY_DATA;

  // Ensure backwards-compat: fill in any missing config keys
  const contacts = (data.contacts ?? []).map((c: any) => {
    // Migrate old price:number → prices:PriceEntry[]
    if (!c.prices && typeof c.price === 'number') {
      return { ...c, prices: [{ amount: c.price, duration: 1, durationUnit: 'shots' }] };
    }
    return c;
  });

  return {
    contacts,
    config: {
      ageTypes: data.config?.ageTypes ?? DEFAULT_AGE_TYPES,
      tierBoundaries: {
        midrangeMin: data.config?.tierBoundaries?.midrangeMin ?? DEFAULT_TIER_BOUNDARIES.midrangeMin,
        premiumMin: data.config?.tierBoundaries?.premiumMin ?? DEFAULT_TIER_BOUNDARIES.premiumMin,
        modelsMin: data.config?.tierBoundaries?.modelsMin ?? DEFAULT_TIER_BOUNDARIES.modelsMin,
      },
    },
  };
}

/**
 * Save the full data file to Drive.
 */
export async function saveData(data: DriveDataFile, appFolderId: string): Promise<void> {
  await saveJson(DATA_FILENAME, data, appFolderId);
}
