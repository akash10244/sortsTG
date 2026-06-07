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
  isSelectionMode: boolean;
  onSelectionModeToggle: () => void;
  viewMode: 'private' | 'shared';
  onViewModeToggle: () => void;
  unseenCount: number;
  onNotificationsClick: () => void;
}

export function Header({
  onSettingsClick,
  onLogout,
  isSaving,
  onSearchToggle,
  onFilterOpen,
  searchActive,
  isSelectionMode,
  onSelectionModeToggle,
  viewMode,
  onViewModeToggle,
  unseenCount,
  onNotificationsClick,
}: HeaderProps) {
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
        {isSaving && <span className="header__saving">Saving…</span>}
      </div>

      {/* Desktop actions */}
      <div className="header__actions header__actions--desktop">
        <button
          className={`header__btn ${viewMode === 'shared' ? 'header__btn--active' : ''}`}
          onClick={onViewModeToggle}
          aria-label="Shared Pools"
          title={viewMode === 'shared' ? "Go to Private Contacts" : "Go to Shared Pools"}
          style={{ fontSize: '1rem', marginRight: '6px' }}
        >
          👥
        </button>
        <button
          className={`header__btn ${isSelectionMode ? 'header__btn--active' : ''}`}
          onClick={onSelectionModeToggle}
          aria-label="Manage Pool"
          title={isSelectionMode ? "Exit Selection" : "Pool Contacts"}
          style={{ fontSize: '1rem', marginRight: '6px' }}
          disabled={viewMode === 'shared'}
        >
          📋
        </button>
        <button
          className="header__btn"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          title="Access Requests"
          style={{ position: 'relative', fontSize: '1rem', marginRight: '6px' }}
        >
          🔔
          {unseenCount > 0 && (
            <span className="header__badge">{unseenCount}</span>
          )}
        </button>
        <button className="header__btn" onClick={onSettingsClick} aria-label="Settings">⚙</button>
        <button className="header__btn header__btn--logout" onClick={onLogout} aria-label="Sign out">Sign out</button>
      </div>

      {/* Mobile actions */}
      <div className="header__actions header__actions--mobile">
        <button
          className={`header__icon-btn header__icon-btn--column ${viewMode === 'shared' ? 'header__icon-btn--active' : ''}`}
          onClick={onViewModeToggle}
          aria-label="Shared Pools"
          title="Shared Pools"
        >
          <span>👥</span>
          <span className="header__icon-text">{viewMode === 'shared' ? 'Private' : 'Shared'}</span>
        </button>

        {viewMode === 'private' && (
          <>
            <button
              className={`header__icon-btn header__icon-btn--column ${isSelectionMode ? 'header__icon-btn--active' : ''}`}
              onClick={onSelectionModeToggle}
              aria-label="Manage Pool"
              title="Manage Pool"
            >
              <span>📋</span>
              <span className="header__icon-text">{isSelectionMode ? 'Exit' : 'Manage'}</span>
            </button>

            <button
              className={`header__icon-btn header__icon-btn--column ${searchActive ? 'header__icon-btn--active' : ''}`}
              onClick={onSearchToggle}
              aria-label="Search"
              title="Search"
            >
              <span>🔍</span>
              <span className="header__icon-text">Search</span>
            </button>

            <button
              className="header__icon-btn header__icon-btn--column"
              onClick={onFilterOpen}
              aria-label="Filters"
              title="Filters"
            >
              <span>⚡</span>
              <span className="header__icon-text">Filters</span>
            </button>
          </>
        )}

        <button
          className="header__icon-btn"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          title="Access Requests"
          style={{ position: 'relative', fontSize: '1.1rem' }}
        >
          🔔
          {unseenCount > 0 && (
            <span className="header__badge">{unseenCount}</span>
          )}
        </button>

        <div className="header__menu-wrap" ref={menuRef}>
          <button className="header__icon-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu" title="Menu">
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
