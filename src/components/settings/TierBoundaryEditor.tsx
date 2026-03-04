/**
 * TierBoundaryEditor.tsx — edit the three price thresholds with live preview.
 */
import type { TierBoundaries } from '../../types';
import { formatPrice, tierRangeLabel } from '../../utils/tierUtils';
import { ALL_TIERS, TIER_LABELS } from '../../types';

interface TierBoundaryEditorProps {
  boundaries: TierBoundaries;
  onChange: (b: TierBoundaries) => void;
}

export function TierBoundaryEditor({ boundaries, onChange }: TierBoundaryEditorProps) {
  const set = (key: keyof TierBoundaries, val: number) =>
    onChange({ ...boundaries, [key]: val });

  return (
    <div className="tier-boundary-editor">
      <h3 className="settings-section__subtitle">Tier Boundaries (₹)</h3>

      <div className="tier-boundary-fields">
        <div className="form-group form-group--sm">
          <label className="form-label" htmlFor="tb-midrange">Mid-range from (₹)</label>
          <input
            id="tb-midrange"
            type="number"
            min={0}
            className="form-input"
            value={boundaries.midrangeMin}
            onChange={e => set('midrangeMin', Number(e.target.value))}
          />
        </div>
        <div className="form-group form-group--sm">
          <label className="form-label" htmlFor="tb-premium">Premium from (₹)</label>
          <input
            id="tb-premium"
            type="number"
            min={boundaries.midrangeMin}
            className="form-input"
            value={boundaries.premiumMin}
            onChange={e => set('premiumMin', Number(e.target.value))}
          />
        </div>
        <div className="form-group form-group--sm">
          <label className="form-label" htmlFor="tb-models">Models from (₹)</label>
          <input
            id="tb-models"
            type="number"
            min={boundaries.premiumMin}
            className="form-input"
            value={boundaries.modelsMin}
            onChange={e => set('modelsMin', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="tier-preview">
        {ALL_TIERS.map(tier => (
          <div key={tier} className={`tier-preview__item tier-preview__item--${tier}`}>
            <span className="tier-preview__label">{TIER_LABELS[tier]}</span>
            <span className="tier-preview__range">{tierRangeLabel(tier, boundaries)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
