/**
 * ActiveToggle.tsx — "Active only" toggle in the filter bar.
 */
import { Toggle } from '../ui/Toggle';

interface ActiveToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ActiveToggle({ value, onChange }: ActiveToggleProps) {
  return (
    <Toggle
      id="active-toggle"
      checked={value}
      onChange={onChange}
      label="Active only"
    />
  );
}
