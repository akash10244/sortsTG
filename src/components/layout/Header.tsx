/**
 * Header.tsx — top nav bar.
 * Desktop: brand + saving + settings + logout.
 * Mobile: brand + search icon + filter icon + ⋮ menu (settings/logout).
 */
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onSettingsClick: () => void;
  onLogout: () => void;
  isSaving: boolean;
  /** Mobile-only: called when search icon is tapped */
  onSearchToggle: () => void;
  /** Mobile-only: called when filter icon is tapped */
  onFilterOpen: () => void;
  searchActive: boolean;
}

export function Header({ onSettingsClick, onLogout, isSaving, onSearchToggle, onFilterOpen, searchActive }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo"></span>
        <h1 className="header__title">SAYRIFLE</h1>
        {isSaving && <span className="header__saving">Saving…</span>}
      </div>

      {/* Desktop actions */}
      <div className="header__actions header__actions--desktop">
        <button className="header__btn" onClick={onSettingsClick} aria-label="Settings">⚙</button>
        <button className="header__btn header__btn--logout" onClick={onLogout} aria-label="Sign out">Sign out</button>
      </div>

      {/* Mobile actions */}
      <div className="header__actions header__actions--mobile">
        <button
          className={`header__icon-btn ${searchActive ? 'header__icon-btn--active' : ''}`}
          onClick={onSearchToggle}
          aria-label="Search"
        >
          🔍
        </button>
        <button className="header__icon-btn" onClick={onFilterOpen} aria-label="Filters">
          ⚡
        </button>
        <div className="header__menu-wrap" ref={menuRef}>
          <button className="header__icon-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            ⋮
          </button>
          {menuOpen && (
            <div className="header__menu">
              <button className="header__menu-item" onClick={() => { setMenuOpen(false); onSettingsClick(); }}>
                ⚙ Settings
              </button>
              <button className="header__menu-item header__menu-item--danger" onClick={() => { setMenuOpen(false); onLogout(); }}>
                ↩ Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
