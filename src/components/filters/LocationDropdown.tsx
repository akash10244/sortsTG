/**
 * LocationDropdown.tsx — multi-select location filter with checkbox popover.
 */
import { useState, useRef, useEffect } from 'react';

interface LocationDropdownProps {
  locations: string[];
  selected: Set<string>;
  onToggle: (loc: string) => void;
  onSelectAll: (locs: string[]) => void;
}

export function LocationDropdown({ locations, selected, onToggle, onSelectAll }: LocationDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (locations.length === 0) return null;

  const allSelected = locations.every(l => selected.has(l));
  const someSelected = locations.some(l => selected.has(l)) && !allSelected;

  return (
    <div className="location-dropdown" ref={ref}>
      <button
        className={`location-dropdown__trigger ${someSelected ? 'location-dropdown__trigger--partial' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        📍 Location {someSelected ? `(${selected.size})` : ''}
        <span className="location-dropdown__arrow">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="location-dropdown__menu" role="listbox">
          {/* Select all shortcut */}
          <label className="location-dropdown__item location-dropdown__item--all">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={() => {
                if (allSelected) onSelectAll([]);
                else onSelectAll(locations);
              }}
            />
            <span>All locations</span>
          </label>
          <div className="location-dropdown__divider" />
          {locations.map(loc => (
            <label key={loc} className="location-dropdown__item">
              <input
                type="checkbox"
                checked={selected.has(loc)}
                onChange={() => onToggle(loc)}
              />
              <span>{loc}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
