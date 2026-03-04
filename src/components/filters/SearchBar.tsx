/**
 * SearchBar.tsx — debounced search input.
 */
import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search by name, phone, Telegram…' }: SearchBarProps) {
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
        type="search"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search contacts"
      />
      {local && (
        <button className="search-bar__clear" onClick={() => { setLocal(''); onChange(''); }} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
