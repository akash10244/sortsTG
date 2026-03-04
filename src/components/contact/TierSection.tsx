/**
 * TierSection.tsx — one tier section (header + card grid).
 */
import type { Contact, PriceType } from '../../types';
import { TIER_LABELS } from '../../types';
import { ContactCard } from './ContactCard';

interface TierSectionProps {
  tier: PriceType;
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}

export function TierSection({ tier, contacts, onEdit, onDelete }: TierSectionProps) {
  return (
    <section className="tier-section">
      <div className="tier-section__header">
        <div className="tier-section__title-row">
          <span className={`tier-section__accent tier-section__accent--${tier}`} />
          <h2 className="tier-section__title">{TIER_LABELS[tier]}</h2>
        </div>
        <span className={`tier-section__count ${contacts.length === 0 ? 'tier-section__count--empty' : ''}`}>
          {contacts.length}
        </span>
      </div>

      {contacts.length > 0 && (
        <div className="card-grid">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
