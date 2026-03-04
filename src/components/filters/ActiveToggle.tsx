/**
 * ActiveToggle.tsx — "Active only" toggle in the filter bar.
 */
import { Toggle } from '../ui/Toggle';

interface ActiveToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function ActiveToggle({ value, onChange, label = 'Active only' }: ActiveToggleProps) {
  return (
    <Toggle
      id={`toggle-${label.replace(/\\s+/g, '-').toLowerCase()}`}
      checked={value}
      onChange={onChange}
      label={label}
    />
  );
}
