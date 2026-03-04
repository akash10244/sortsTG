/**
 * SettingsModal.tsx — tabbed modal for AgeTypes and TierBoundaries.
 */
import { useState } from 'react';
import type { AppConfig, Contact } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AgeTypeManager } from './AgeTypeManager';
import { TierBoundaryEditor } from './TierBoundaryEditor';

type Tab = 'ageTypes' | 'tiers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  contacts: Contact[];
  onSave: (config: AppConfig) => Promise<void>;
  isSaving: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  config,
  contacts,
  onSave,
  isSaving,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('ageTypes');
  const [draft, setDraft] = useState<AppConfig>(config);

  // Sync draft when modal opens
  const handleOpen = () => { setDraft(config); setTab('ageTypes'); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="md">
      <div className="settings-modal" onFocus={() => { if (!draft) handleOpen(); }}>
        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${tab === 'ageTypes' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('ageTypes')}
          >
            Age Types
          </button>
          <button
            className={`settings-tab ${tab === 'tiers' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('tiers')}
          >
            Tier Boundaries
          </button>
        </div>

        {/* Tab content */}
        <div className="settings-content">
          {tab === 'ageTypes' && (
            <AgeTypeManager
              ageTypes={draft.ageTypes}
              contacts={contacts}
              onChange={types => setDraft(d => ({ ...d, ageTypes: types }))}
            />
          )}
          {tab === 'tiers' && (
            <TierBoundaryEditor
              boundaries={draft.tierBoundaries}
              onChange={b => setDraft(d => ({ ...d, tierBoundaries: b }))}
            />
          )}
        </div>

        {/* Footer */}
        <div className="form-footer">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(draft)} loading={isSaving}>
            Save settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}
