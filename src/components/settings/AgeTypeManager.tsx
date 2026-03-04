/**
 * AgeTypeManager.tsx — add/delete user-defined ageType enum values.
 */
import { useState } from 'react';
import type { Contact } from '../../types';
import { Button } from '../ui/Button';

interface AgeTypeManagerProps {
  ageTypes: string[];
  contacts: Contact[];
  onChange: (types: string[]) => void;
}

export function AgeTypeManager({ ageTypes, contacts, onChange }: AgeTypeManagerProps) {
  const [newType, setNewType] = useState('');
  const [error, setError] = useState('');

  const usageCount = (type: string) => contacts.filter(c => c.ageType === type).length;

  const add = () => {
    const val = newType.trim();
    if (!val) return;
    if (ageTypes.includes(val)) {
      setError('Already exists');
      return;
    }
    setError('');
    onChange([...ageTypes, val]);
    setNewType('');
  };

  const remove = (type: string) => {
    onChange(ageTypes.filter(t => t !== type));
  };

  return (
    <div className="age-type-manager">
      <h3 className="settings-section__subtitle">Age Types</h3>

      <ul className="age-type-list">
        {ageTypes.map(t => {
          const count = usageCount(t);
          return (
            <li key={t} className="age-type-list__item">
              <span className="age-type-list__label">{t}</span>
              {count > 0 && <span className="age-type-list__usage">{count} contact{count !== 1 ? 's' : ''}</span>}
              <button
                className="age-type-list__delete"
                onClick={() => remove(t)}
                aria-label={`Delete ${t}`}
                title={count > 0 ? `${count} contacts still use this type` : undefined}
              >
                🗑️
              </button>
            </li>
          );
        })}
      </ul>

      {ageTypes.length === 0 && (
        <p className="age-type-list__empty">No age types defined.</p>
      )}

      <div className="age-type-add">
        <input
          className="form-input"
          value={newType}
          onChange={e => { setNewType(e.target.value); setError(''); }}
          placeholder="New age type…"
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <Button size="sm" onClick={add}>Add</Button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
