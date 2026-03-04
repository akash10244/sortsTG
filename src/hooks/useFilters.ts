/**
 * useFilters.ts
 *
 * Manages all search and filter state and produces a derived filtered list.
 * No Drive or network calls — purely local state and computation.
 */

import { useState, useMemo, useCallback } from 'react';
import { ALL_TIERS } from '../types';
import { sortByPrice } from '../utils/tierUtils';
import type { Contact, PriceType, FilterState } from '../types';

interface UseFiltersReturn {
  filters: FilterState;
  setQuery: (q: string) => void;
  setShowActiveOnly: (v: boolean) => void;
  toggleTier: (tier: PriceType) => void;
  toggleLocation: (loc: string) => void;
  setAllLocations: (locs: string[]) => void;
  filteredContacts: Contact[];
  isSearching: boolean;
  distinctLocations: string[];
}

export function useFilters(contacts: Contact[]): UseFiltersReturn {
  const [query, setQueryRaw] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedTiers, setSelectedTiers] = useState<Set<PriceType>>(new Set(ALL_TIERS));
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set<string>());

  // Derived: distinct locations from the full contact list
  const distinctLocations = useMemo(() => {
    const locs = new Set(contacts.map(c => c.location).filter(Boolean));
    return [...locs].sort();
  }, [contacts]);

  // Sync selectedLocations when new locations appear (ensure they default to selected)
  const setQuery = useCallback((q: string) => setQueryRaw(q), []);

  const toggleTier = useCallback((tier: PriceType) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }, []);

  const toggleLocation = useCallback((loc: string) => {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  }, []);

  const setAllLocations = useCallback((locs: string[]) => {
    setSelectedLocations(new Set(locs));
  }, []);

  // Derived filtered list
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const locationsInitialised = selectedLocations.size > 0;

    return sortByPrice(
      contacts.filter(c => {
        // Active filter
        if (showActiveOnly && !c.isActive) return false;

        // Tier filter
        if (!selectedTiers.has(c.priceType)) return false;

        // Location filter (only restrict when some locations explicitly selected)
        if (locationsInitialised && !selectedLocations.has(c.location)) return false;

        // Search
        if (q) {
          const haystack = [c.name, c.contactValue, c.location].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
    );
  }, [contacts, query, showActiveOnly, selectedTiers, selectedLocations]);

  const isSearching = query.trim().length > 0;

  return {
    filters: { query, showActiveOnly, selectedTiers, selectedLocations },
    setQuery,
    setShowActiveOnly,
    toggleTier,
    toggleLocation,
    setAllLocations,
    filteredContacts,
    isSearching,
    distinctLocations,
  };
}
