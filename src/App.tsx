/**
 * App.tsx
 *
 * Thin shell: delegates auth, Drive init, data, and filters to hooks.
 * Renders LoginScreen or the full authenticated contact manager.
 */

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDrive } from './hooks/useDrive';
import { useContacts } from './hooks/useContacts';
import { useFilters } from './hooks/useFilters';

import LoginScreen from './components/LoginScreen';
import { Header } from './components/layout/Header';
import { SearchBar } from './components/filters/SearchBar';
import { FilterBar } from './components/filters/FilterBar';
import { ContactGrid } from './components/contact/ContactGrid';
import { ContactModal } from './components/forms/ContactModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { SettingsModal } from './components/settings/SettingsModal';
import { BottomSheet } from './components/ui/BottomSheet';
import { Spinner } from './components/ui/Spinner';

import type { Contact } from './types';
import './index.css';

// ─── Authenticated App (inner) ─────────────────────────────────────────────────

function AuthenticatedApp({ appFolderId, onLogout }: { appFolderId: string; onLogout: () => void }) {
  const { imagesFolderId, isDriveReady, driveError } = useDrive(appFolderId);
  const { contacts, config, isLoading, isSaving, addContact, updateContact, deleteContact, updateConfig } = useContacts(appFolderId);
  const {
    filters,
    setQuery,
    setActiveFilter,
    setMidValueFilter,
    setDidntExploreFilter,
    toggleTier,
    toggleLocation,
    setAllLocations,
    filteredContacts,
    isSearching,
    distinctLocations,
  } = useFilters(contacts);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [viewTarget, setViewTarget] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingSaving, setIsSettingSaving] = useState(false);

  // ── Mobile UI state ────────────────────────────────────────────────────────
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const handleSearchToggle = () => {
    if (mobileSearchOpen) {
      setMobileSearchOpen(false);
      setQuery('');  // clear query so cards return to normal
    } else {
      setMobileSearchOpen(true);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveContact = async (
    draft: any,
    newFiles: File[],
    removedFileIds: string[],
    original: Contact | null
  ) => {
    if (!imagesFolderId) throw new Error('Drive not ready');
    if (original) {
      await updateContact(original.id, draft, newFiles, removedFileIds, imagesFolderId);
    } else {
      await addContact(draft, newFiles, imagesFolderId);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteContact(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleSaveSettings = async (newConfig: typeof config) => {
    setIsSettingSaving(true);
    await updateConfig(newConfig);
    setIsSettingSaving(false);
    setSettingsOpen(false);
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (!isDriveReady || isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
        <p>{driveError ?? 'Loading your contacts…'}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        onLogout={onLogout}
        isSaving={isSaving}
        onSearchToggle={handleSearchToggle}
        onFilterOpen={() => setFilterSheetOpen(true)}
        searchActive={mobileSearchOpen || filters.query.length > 0}
      />

      {/* Desktop toolbar — hidden on mobile */}
      <div className="app__toolbar app__toolbar--desktop">
        <SearchBar value={filters.query} onChange={setQuery} />
        <FilterBar
          activeFilter={filters.activeFilter}
          onActiveFilter={setActiveFilter}
          midValueFilter={filters.midValueFilter}
          onMidValueFilter={setMidValueFilter}
          didntExploreFilter={filters.didntExploreFilter}
          onDidntExploreFilter={setDidntExploreFilter}
          selectedTiers={filters.selectedTiers}
          onTierToggle={toggleTier}
          distinctLocations={distinctLocations}
          selectedLocations={filters.selectedLocations}
          onLocationToggle={toggleLocation}
          onSelectAllLocations={setAllLocations}
        />
      </div>

      {/* Mobile search — expands below header when search icon tapped */}
      {mobileSearchOpen && (
        <div className="app__toolbar app__toolbar--mobile-search">
          <SearchBar value={filters.query} onChange={setQuery} autoFocus />
        </div>
      )}

      <main className="app__main">
        <ContactGrid
          contacts={filteredContacts}
          isSearching={isSearching}
          onEdit={c => setEditTarget(c)}
          onDelete={c => setDeleteTarget(c)}
          onView={c => setViewTarget(c)}
        />
      </main>

      {/* FAB — Add contact */}
      <button
        className="fab"
        onClick={() => setAddOpen(true)}
        aria-label="Add contact"
        title="Add contact"
      >
        ＋
      </button>

      {/* Filter bottom sheet — mobile only */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filters"
      >
        <FilterBar
          activeFilter={filters.activeFilter}
          onActiveFilter={setActiveFilter}
          midValueFilter={filters.midValueFilter}
          onMidValueFilter={setMidValueFilter}
          didntExploreFilter={filters.didntExploreFilter}
          onDidntExploreFilter={setDidntExploreFilter}
          selectedTiers={filters.selectedTiers}
          onTierToggle={toggleTier}
          distinctLocations={distinctLocations}
          selectedLocations={filters.selectedLocations}
          onLocationToggle={toggleLocation}
          onSelectAllLocations={setAllLocations}
          vertical
        />
      </BottomSheet>

      {/* Add / Edit / View modal */}
      <ContactModal
        isOpen={addOpen || editTarget !== null || viewTarget !== null}
        onClose={() => { setAddOpen(false); setEditTarget(null); setViewTarget(null); }}
        contact={viewTarget || editTarget}
        mode={viewTarget ? 'view' : editTarget ? 'edit' : 'add'}
        config={config}
        onSave={handleSaveContact}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete contact"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Settings */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        contacts={contacts}
        onSave={handleSaveSettings}
        isSaving={isSettingSaving}
      />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { isLoading, isAuthenticated, appFolderId, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
        <p>Restoring session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !appFolderId) {
    return <LoginScreen onLogin={login} isLoading={isLoading} error={error} />;
  }

  return <AuthenticatedApp appFolderId={appFolderId} onLogout={logout} />;
}