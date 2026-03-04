/**
 * tierUtils.ts
 *
 * Pure functions for price tier derivation, sorting, and formatting.
 */

import type { PriceType, TierBoundaries, Contact, PriceEntry } from '../types';

/**
 * Get the minimum amount from a prices array.
 * Returns 0 if the array is undefined or empty.
 */
export function minPrice(prices: PriceEntry[] | undefined): number {
  if (!prices || prices.length === 0) return 0;
  return Math.min(...prices.map(p => p.amount));
}

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
 * Sort contacts ascending by their minimum price.
 */
export function sortByPrice(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => minPrice(a.prices) - minPrice(b.prices));
}

/**
 * Re-derive priceType for every contact using the updated boundaries.
 */
export function recomputeTiers(contacts: Contact[], boundaries: TierBoundaries): Contact[] {
  return contacts.map(c => ({
    ...c,
    priceType: deriveTier(minPrice(c.prices), boundaries),
  }));
}

/**
 * Format a price as compact INR: 13000 → "₹13k", 1500 → "₹1.5k", 500 → "₹500"
 */
export function formatPriceCompact(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `₹${amount}`;
}

/**
 * Format a full price as INR with thousands separator: 15000 → "₹15,000"
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function unitLabel(unit: PriceEntry['durationUnit'], n: number): string {
  if (unit === 'shots') return n === 1 ? 'shot' : 'shots';
  return n === 1 ? 'hr' : 'hrs';
}

/**
 * Format a single PriceEntry: "₹13k / 2 shots"
 */
export function formatPriceEntry(entry: PriceEntry): string {
  return `${formatPriceCompact(entry.amount)} / ${entry.duration} ${unitLabel(entry.durationUnit, entry.duration)}`;
}

/**
 * Format all price entries as a short summary: "₹13k/2shots · ₹15k/3hrs"
 * Safely returns '' if prices is undefined or empty.
 */
export function formatPrices(prices: PriceEntry[] | undefined): string {
  if (!prices || prices.length === 0) return '';
  return prices.map(p => `${formatPriceCompact(p.amount)}/${p.duration}${unitLabel(p.durationUnit, p.duration)}`).join(' · ');
}

/**
 * Build a human-readable tier range label.
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
