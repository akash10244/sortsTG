/**
 * TierChips.tsx — tier multi-select chip buttons.
 */
import type { PriceType } from '../../types';
import { ALL_TIERS, TIER_LABELS } from '../../types';

interface TierChipsProps {
  selected: Set<PriceType>;
  onToggle: (tier: PriceType) => void;
}

export function TierChips({ selected, onToggle }: TierChipsProps) {
  return (
    <div className="tier-chips" role="group" aria-label="Filter by tier">
      {ALL_TIERS.map(tier => (
        <button
          key={tier}
          className={`tier-chip tier-chip--${tier} ${selected.has(tier) ? 'tier-chip--active' : ''}`}
          onClick={() => onToggle(tier)}
          aria-pressed={selected.has(tier)}
        >
          {TIER_LABELS[tier]}
        </button>
      ))}
    </div>
  );
}
