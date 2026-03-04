/**
 * FilterBar.tsx — horizontal strip composing all filter controls.
 */
import type { PriceType } from '../../types';
import { ActiveToggle } from './ActiveToggle';
import { TierChips } from './TierChips';
import { LocationDropdown } from './LocationDropdown';

interface FilterBarProps {
  showActiveOnly: boolean;
  onActiveToggle: (v: boolean) => void;
  selectedTiers: Set<PriceType>;
  onTierToggle: (t: PriceType) => void;
  distinctLocations: string[];
  selectedLocations: Set<string>;
  onLocationToggle: (l: string) => void;
  onSelectAllLocations: (locs: string[]) => void;
}

export function FilterBar({
  showActiveOnly,
  onActiveToggle,
  selectedTiers,
  onTierToggle,
  distinctLocations,
  selectedLocations,
  onLocationToggle,
  onSelectAllLocations,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <ActiveToggle value={showActiveOnly} onChange={onActiveToggle} />
      <div className="filter-bar__divider" />
      <TierChips selected={selectedTiers} onToggle={onTierToggle} />
      <div className="filter-bar__divider" />
      <LocationDropdown
        locations={distinctLocations}
        selected={selectedLocations}
        onToggle={onLocationToggle}
        onSelectAll={onSelectAllLocations}
      />
    </div>
  );
}
