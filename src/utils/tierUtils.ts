/**
 * tierUtils.ts
 *
 * Pure functions for price tier derivation and sorting.
 * Centralising this logic means a single change propagates everywhere.
 */

import type { PriceType, TierBoundaries, Contact } from '../types';

/**
 * Derive the correct PriceType for a given price and boundary config.
 */
export function deriveTier(price: number, boundaries: TierBoundaries): PriceType {
  if (price >= boundaries.modelsMin) return 'models';
  if (price >= boundaries.premiumMin) return 'premium';
  if (price >= boundaries.midrangeMin) return 'midrange';
  return 'budget';
}

/** Canonical display order for tier sections */
export const TIER_ORDER: PriceType[] = ['budget', 'midrange', 'premium', 'models'];

/**
 * Sort contacts ascending by price (the default display order).
 * Returns a new array — never mutates the input.
 */
export function sortByPrice(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => a.price - b.price);
}

/**
 * Re-derive priceType for every contact using the updated boundaries.
 * Used when tier boundaries change in Settings.
 */
export function recomputeTiers(contacts: Contact[], boundaries: TierBoundaries): Contact[] {
  return contacts.map(c => ({
    ...c,
    priceType: deriveTier(c.price, boundaries),
  }));
}

/**
 * Format a price as INR with thousands separator.
 * e.g. 15000 → "₹15,000"
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Build a human-readable tier range label.
 * e.g. "Budget: < ₹7,000"
 */
export function tierRangeLabel(tier: PriceType, boundaries: TierBoundaries): string {
  switch (tier) {
    case 'budget':
      return `< ${formatPrice(boundaries.midrangeMin)}`;
    case 'midrange':
      return `${formatPrice(boundaries.midrangeMin)} – ${formatPrice(boundaries.premiumMin - 1)}`;
    case 'premium':
      return `${formatPrice(boundaries.premiumMin)} – ${formatPrice(boundaries.modelsMin - 1)}`;
    case 'models':
      return `≥ ${formatPrice(boundaries.modelsMin)}`;
  }
}
