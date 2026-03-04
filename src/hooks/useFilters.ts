/**
 * useFilters.ts
 *
 * Manages all search and filter state and produces a derived filtered list.
 * No Drive or network calls — purely local state and computation.
 */

import { useState, useMemo, useCallback } from 'react';
import { ALL_TIERS } from '../types';
import { sortByPrice } from '../utils/tierUtils';
import type { Contact, PriceType, FilterState, TriState } from '../types';

interface UseFiltersReturn {
  filters: FilterState;
  setQuery: (q: string) => void;
  setActiveFilter: (v: TriState) => void;
  setMidValueFilter: (v: TriState) => void;
  setDidntExploreFilter: (v: TriState) => void;
  toggleTier: (tier: PriceType) => void;
  toggleLocation: (loc: string) => void;
  setAllLocations: (locs: string[]) => void;
  filteredContacts: Contact[];
  isSearching: boolean;
  distinctLocations: string[];
}

/** Helper: apply a tri-state filter to a boolean field */
function applyTriState(filter: TriState, value: boolean | undefined): boolean {
  if (filter === 'ignore') return true;
  if (filter === 'true') return !!value;
  return !value;
}

export function useFilters(contacts: Contact[]): UseFiltersReturn {
  const [query, setQueryRaw] = useState('');
  const [activeFilter, setActiveFilter] = useState<TriState>('true');
  const [midValueFilter, setMidValueFilter] = useState<TriState>('false');
  const [didntExploreFilter, setDidntExploreFilter] = useState<TriState>('false');
  const [selectedTiers, setSelectedTiers] = useState<Set<PriceType>>(new Set(ALL_TIERS));
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set<string>());

  // Derived: distinct locations from the full contact list
  const distinctLocations = useMemo(() => {
    const locs = new Set(contacts.map(c => c.location).filter(Boolean));
    return [...locs].sort();
  }, [contacts]);

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
        // Tri-state boolean filters
        if (!applyTriState(activeFilter, c.isActive)) return false;
        if (!applyTriState(midValueFilter, c.isMidValue)) return false;
        if (!applyTriState(didntExploreFilter, c.didntExplorex)) return false;

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
  }, [contacts, query, activeFilter, midValueFilter, didntExploreFilter, selectedTiers, selectedLocations]);

  const isSearching = query.trim().length > 0;

  return {
    filters: { query, activeFilter, midValueFilter, didntExploreFilter, selectedTiers, selectedLocations },
    setQuery,
    setActiveFilter,
    setMidValueFilter,
    setDidntExploreFilter,
    toggleTier,
    toggleLocation,
    setAllLocations,
    filteredContacts,
    isSearching,
    distinctLocations,
  };
}
