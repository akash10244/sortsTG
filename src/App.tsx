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
    setShowActiveOnly,
    toggleTier,
    toggleLocation,
    setAllLocations,
    filteredContacts,
    isSearching,
    distinctLocations,
  } = useFilters(contacts);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingSaving, setIsSettingSaving] = useState(false);

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
      />

      <div className="app__toolbar">
        <SearchBar value={filters.query} onChange={setQuery} />
        <FilterBar
          showActiveOnly={filters.showActiveOnly}
          onActiveToggle={setShowActiveOnly}
          selectedTiers={filters.selectedTiers}
          onTierToggle={toggleTier}
          distinctLocations={distinctLocations}
          selectedLocations={filters.selectedLocations}
          onLocationToggle={toggleLocation}
          onSelectAllLocations={setAllLocations}
        />
      </div>

      <main className="app__main">
        <ContactGrid
          contacts={filteredContacts}
          isSearching={isSearching}
          onEdit={c => setEditTarget(c)}
          onDelete={c => setDeleteTarget(c)}
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

      {/* Add / Edit modal */}
      <ContactModal
        isOpen={addOpen || editTarget !== null}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        contact={editTarget}
        config={config}
        imagesFolderId={imagesFolderId ?? ''}
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