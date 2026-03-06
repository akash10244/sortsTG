/**
 * TierSection.tsx — one tier section (header + card grid).
 */
import type { Contact, PriceType } from '../../types';
import { TIER_LABELS } from '../../types';
import { ContactCard } from './ContactCard';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface TierSectionProps {
  tier: PriceType;
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
  onView: (c: Contact) => void;
}

export function TierSection({ tier, contacts, onEdit, onDelete, onView }: TierSectionProps) {
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(`tier-expanded-${tier}`, true);

  return (
    <section className="tier-section">
      <div 
        className="tier-section__header" 
        onClick={() => setIsExpanded(e => !e)}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="tier-section__title-row">
          <span className={`tier-section__accent tier-section__accent--${tier}`} />
          <h2 className="tier-section__title">{TIER_LABELS[tier]}</h2>
        </div>
        <div className="tier-section__header-right">
          <span className={`tier-section__count ${contacts.length === 0 ? 'tier-section__count--empty' : ''}`}>
            {contacts.length}
          </span>
          <span className={`tier-section__chevron ${isExpanded ? 'tier-section__chevron--open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
      </div>

      {isExpanded && contacts.length > 0 && (
        <div className="card-grid">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onEdit={onEdit} onDelete={onDelete} onView={onView} />
          ))}
        </div>
      )}
    </section>
  );
}
