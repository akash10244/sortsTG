/**
 * Header.tsx — top navigation bar.
 */
interface HeaderProps {
  onSettingsClick: () => void;
  onLogout: () => void;
  isSaving: boolean;
}

export function Header({ onSettingsClick, onLogout, isSaving }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">✦</span>
        <h1 className="header__title">SortsTG</h1>
        {isSaving && <span className="header__saving">Saving…</span>}
      </div>
      <div className="header__actions">
        <button className="header__btn" onClick={onSettingsClick} aria-label="Settings">
          ⚙
        </button>
        <button className="header__btn header__btn--logout" onClick={onLogout} aria-label="Sign out">
          Sign out
        </button>
      </div>
    </header>
  );
}
