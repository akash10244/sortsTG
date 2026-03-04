/**
 * SearchBar.tsx — debounced search input.
 */
import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search by name, phone, Telegram…', autoFocus }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  // Debounce: push to parent 300ms after last keystroke
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(t);
  }, [local, onChange]);

  // Sync from parent (e.g. clear)
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="search-bar">
      <span className="search-bar__icon">🔍</span>
      <input
        className="search-bar__input"
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search contacts"
        autoFocus={autoFocus}
      />
      {local && (
        <button className="search-bar__clear" onClick={() => { setLocal(''); onChange(''); }} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
