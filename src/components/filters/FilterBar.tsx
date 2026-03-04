/**
 * FilterBar.tsx — horizontal strip composing all filter controls.
 */
import type { PriceType, TriState } from '../../types';
import { TierChips } from './TierChips';
import { LocationDropdown } from './LocationDropdown';

interface FilterBarProps {
  activeFilter: TriState;
  onActiveFilter: (v: TriState) => void;
  lessInterestedFilter: TriState;
  onLessInterestedFilter: (v: TriState) => void;
  didntExploreFilter: TriState;
  onDidntExploreFilter: (v: TriState) => void;
  selectedTiers: Set<PriceType>;
  onTierToggle: (t: PriceType) => void;
  distinctLocations: string[];
  selectedLocations: Set<string>;
  onLocationToggle: (l: string) => void;
  onSelectAllLocations: (locs: string[]) => void;
  vertical?: boolean;
}

const TRI_LABELS: { value: TriState; label: string }[] = [
  { value: 'true',   label: 'Yes' },
  { value: 'false',  label: 'No'  },
  { value: 'ignore', label: 'Any' },
];

function TriPills({ label, value, onChange }: { label: string; value: TriState; onChange: (v: TriState) => void }) {
  return (
    <div className="tri-pill-group">
      <span className="tri-pill-group__label">{label}</span>
      <div className="tri-pill-group__pills">
        {TRI_LABELS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`tri-pill ${value === opt.value ? `tri-pill--active tri-pill--${opt.value}` : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterBar({
  activeFilter,
  onActiveFilter,
  lessInterestedFilter,
  onLessInterestedFilter,
  didntExploreFilter,
  onDidntExploreFilter,
  selectedTiers,
  onTierToggle,
  distinctLocations,
  selectedLocations,
  onLocationToggle,
  onSelectAllLocations,
  vertical = false,
}: FilterBarProps) {
  return (
    <div className={`filter-bar ${vertical ? 'filter-bar--vertical' : ''}`}>
      <div className="filter-bar__toggles">
        <TriPills label="Active"       value={activeFilter}       onChange={onActiveFilter} />
        <TriPills label="Less Interested"  value={lessInterestedFilter}     onChange={onLessInterestedFilter} />
        <TriPills label="Didn't Explore"   value={didntExploreFilter} onChange={onDidntExploreFilter} />
      </div>
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
