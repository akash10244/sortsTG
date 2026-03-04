// ─── Shared TypeScript interfaces ────────────────────────────────────────────

/** Tokens returned after exchanging or refreshing */
export interface TokenSet {
  accessToken: string;
  /** Only present on first exchange, null on refresh */
  refreshToken: string | null;
  /** Unix timestamp (ms) when the access token expires */
  expiresAt: number;
}

/** State shape used by the useAuth hook */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type PriceType = 'budget' | 'midrange' | 'premium' | 'models';
export type ContactType = 'phone' | 'telegram';
export type DurationUnit = 'shots' | 'hrs';

/** A single price+duration entry, e.g. ₹13,000 / 2 shots */
export interface PriceEntry {
  amount: number;       // in INR
  duration: number;     // e.g. 2
  durationUnit: DurationUnit; // 'shots' | 'hrs'
}

export interface Contact {
  id: string;
  name: string;
  age: number;
  ageType: string;
  contactType: ContactType;
  contactValue: string;
  location: string;
  reviewText: string;
  /** Google Drive file IDs for images stored in the images subfolder */
  imageFileIds: string[];
  isActive: boolean;
  /** One or more price+duration entries. Tier derived from min(prices.amount). */
  prices: PriceEntry[];
  /** Auto-derived from min(prices.amount) + tier boundaries on every save */
  priceType: PriceType;
  createdAt: string;
  updatedAt: string;
}

export interface TierBoundaries {
  /** Budget is everything below this */
  midrangeMin: number;
  /** Midrange is midrangeMin..premiumMin-1 */
  premiumMin: number;
  /** Premium is premiumMin..modelsMin-1. Models is >= modelsMin */
  modelsMin: number;
}

export interface AppConfig {
  ageTypes: string[];
  tierBoundaries: TierBoundaries;
}

/** The shape of contacts.json stored on Drive */
export interface DriveDataFile {
  contacts: Contact[];
  config: AppConfig;
}

/** Result from uploadFile — now returns id + link together */
export interface UploadResult {
  id: string;
  webViewLink: string;
}

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface FilterState {
  query: string;
  showActiveOnly: boolean;
  selectedTiers: Set<PriceType>;
  selectedLocations: Set<string>;
}

export const ALL_TIERS: PriceType[] = ['budget', 'midrange', 'premium', 'models'];

export const TIER_LABELS: Record<PriceType, string> = {
  budget: 'Budget',
  midrange: 'Mid-range',
  premium: 'Premium',
  models: 'Models',
};

export const DEFAULT_TIER_BOUNDARIES: TierBoundaries = {
  midrangeMin: 7000,
  premiumMin: 13000,
  modelsMin: 18000,
};

export const DEFAULT_AGE_TYPES = ['College Chick', 'Young', 'MILF', 'Old'];
