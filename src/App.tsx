/**
 * App.tsx
 *
 * Core application wrapper. Coordinates Firebase Authentication,
 * and renders either the login screen or the contact manager grid.
 */

import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
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
import { SharedPoolsExplorer } from './components/contact/SharedPoolsExplorer';
import { IncomingRequestsModal } from './components/contact/IncomingRequestsModal';
import { subscribeToIncomingRequests, subscribeToSentRequests } from './services/firebaseService';

import type { Contact, ContactRequest } from './types';
import './index.css';

// ─── Authenticated App (inner) ─────────────────────────────────────────────────

interface AuthenticatedAppProps {
  userId: string;
  currentUserEmail: string;
  onLogout: () => void;
}

function AuthenticatedApp({ userId, currentUserEmail, onLogout }: AuthenticatedAppProps) {
  const {
    contacts,
    config,
    isLoading,
    isSaving,
    addContact,
    updateContact,
    deleteContact,
    updateConfig,
    poolContacts,
    depoolContacts,
  } = useContacts(userId);

  // ── View Mode State ────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'private' | 'shared'>('private');

  const {
    filters,
    setQuery,
    setActiveFilter,
    setLessInterestedFilter,
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
  const [isSavingPool, setIsSavingPool] = useState(false);

  // ── Mobile UI state ────────────────────────────────────────────────────────
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // ── Requests States ────────────────────────────────────────────────────────
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [seenRequestIds, setSeenRequestIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sorts_seen_requests') || '[]');
    } catch {
      return [];
    }
  });

  // ── Selection State ────────────────────────────────────────────────────────
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredContacts.map(c => c.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedContactIds.has(id));

    if (allSelected) {
      setSelectedContactIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedContactIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleSavePool = async () => {
    setIsSavingPool(true);
    try {
      const toPoolIds: string[] = [];
      const toDepoolIds: string[] = [];

      contacts.forEach((c) => {
        const isSelected = selectedContactIds.has(c.id);
        const wasPooled = !!c.isPooled;

        if (isSelected && !wasPooled) {
          toPoolIds.push(c.id);
        } else if (!isSelected && wasPooled) {
          toDepoolIds.push(c.id);
        }
      });

      // Execute updates in parallel or sequence
      if (toPoolIds.length > 0) {
        await poolContacts(toPoolIds);
      }
      if (toDepoolIds.length > 0) {
        await depoolContacts(toDepoolIds);
      }

      setIsSelectionMode(false);
      setSelectedContactIds(new Set());
    } catch (err: any) {
      console.error('Failed to update shared pool:', err);
      alert('Failed to update shared pool: ' + (err.message ?? err));
    } finally {
      setIsSavingPool(false);
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedContactIds(new Set());
  };

  const handleSearchToggle = () => {
    if (mobileSearchOpen) {
      setMobileSearchOpen(false);
      setQuery('');
    } else {
      setMobileSearchOpen(true);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveContact = async (
    draft: any,
    newFiles: File[],
    removedImageIds: string[],
    original: Contact | null
  ) => {
    if (original) {
      await updateContact(original.id, draft, newFiles, removedImageIds);
    } else {
      await addContact(draft, newFiles);
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

  // ── Requests Subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setIncomingRequests([]);
      setSentRequests([]);
      return;
    }

    const unsubIncoming = subscribeToIncomingRequests(
      userId,
      (requests) => setIncomingRequests(requests),
      (err) => console.error('Incoming requests subscription failed:', err)
    );

    const unsubSent = subscribeToSentRequests(
      userId,
      (requests) => setSentRequests(requests),
      (err) => console.error('Sent requests subscription failed:', err)
    );

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, [userId]);

  const unseenCount = incomingRequests.filter(
    (req) => req.status === 'pending' && !seenRequestIds.includes(req.id)
  ).length;

  const handleNotificationsClick = () => {
    setRequestsModalOpen(true);
    // Mark all incoming pending requests as seen
    const updatedSeen = [...seenRequestIds];
    let changed = false;
    incomingRequests.forEach((req) => {
      if (req.status === 'pending' && !updatedSeen.includes(req.id)) {
        updatedSeen.push(req.id);
        changed = true;
      }
    });
    if (changed) {
      setSeenRequestIds(updatedSeen);
      localStorage.setItem('sorts_seen_requests', JSON.stringify(updatedSeen));
    }
  };

  // ── Database Loading state ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
        <p>Syncing contacts from Firebase…</p>
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
        isSelectionMode={isSelectionMode}
        onSelectionModeToggle={() => {
          if (!isSelectionMode) {
            // Entering selection mode: pre-select already pooled contacts
            const pooledIds = new Set(
              contacts.filter(c => c.isPooled).map(c => c.id)
            );
            setSelectedContactIds(pooledIds);
            setIsSelectionMode(true);
          } else {
            // Exiting selection mode
            setIsSelectionMode(false);
            setSelectedContactIds(new Set());
          }
        }}
        viewMode={viewMode}
        onViewModeToggle={() => {
          setViewMode(prev => {
            const next = prev === 'private' ? 'shared' : 'private';
            setIsSelectionMode(false);
            setSelectedContactIds(new Set());
            return next;
          });
        }}
        unseenCount={unseenCount}
        onNotificationsClick={handleNotificationsClick}
      />

      {/* Desktop toolbar — hidden on mobile and in shared view */}
      {viewMode === 'private' && (
        <div className="app__toolbar app__toolbar--desktop">
          <SearchBar value={filters.query} onChange={setQuery} />
          <FilterBar
            activeFilter={filters.activeFilter}
            onActiveFilter={setActiveFilter}
            lessInterestedFilter={filters.lessInterestedFilter}
            onLessInterestedFilter={setLessInterestedFilter}
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
      )}

      {/* Mobile search — expands below header when search icon tapped */}
      {mobileSearchOpen && (
        <div className="app__toolbar app__toolbar--mobile-search">
          <SearchBar value={filters.query} onChange={setQuery} autoFocus />
        </div>
      )}

      <main className="app__main" style={{ paddingBottom: isSelectionMode ? '80px' : undefined }}>
        {viewMode === 'private' ? (
          <ContactGrid
            contacts={filteredContacts}
            isSearching={isSearching}
            onEdit={c => setEditTarget(c)}
            onDelete={c => setDeleteTarget(c)}
            onView={c => setViewTarget(c)}
            isSelectionMode={isSelectionMode}
            selectedContactIds={selectedContactIds}
            onToggleSelect={handleToggleSelect}
          />
        ) : (
          <SharedPoolsExplorer
            currentUserId={userId}
            currentUserEmail={currentUserEmail}
            sentRequests={sentRequests}
          />
        )}
      </main>

      {/* FAB — Add contact */}
      {!isSelectionMode && viewMode === 'private' && (
        <button
          className="fab"
          onClick={() => setAddOpen(true)}
          aria-label="Add contact"
          title="Add contact"
        >
          ＋
        </button>
      )}

      {/* Filter bottom sheet — mobile only */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filters"
      >
        <FilterBar
          activeFilter={filters.activeFilter}
          onActiveFilter={setActiveFilter}
          lessInterestedFilter={filters.lessInterestedFilter}
          onLessInterestedFilter={setLessInterestedFilter}
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
        userId={userId}
        onSave={handleSaveSettings}
        isSaving={isSettingSaving}
      />

      <IncomingRequestsModal
        isOpen={requestsModalOpen}
        onClose={() => setRequestsModalOpen(false)}
        requests={incomingRequests}
      />

      {/* Selection Toolbar */}
      {isSelectionMode && (
        <div className="selection-toolbar">
          <div className="selection-toolbar__left">
            <button
              className="btn btn--outline btn--sm"
              onClick={handleSelectAll}
            >
              {filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id))
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span className="selection-toolbar__count">
              {selectedContactIds.size} selected
            </span>
          </div>
          <div className="selection-toolbar__actions">
            <button
              className="btn btn--accent btn--sm"
              onClick={handleSavePool}
              disabled={isSavingPool}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {isSavingPool ? '⏳ Saving...' : '💾 Save Pool Changes'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleCancelSelection} disabled={isSavingPool}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { isLoading, isAuthenticated, userId, user, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
        <p>Restoring session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return <LoginScreen onLogin={login} isLoading={isLoading} error={error} />;
  }

  return (
    <AuthenticatedApp
      userId={userId}
      currentUserEmail={user?.email || ''}
      onLogout={logout}
    />
  );
}