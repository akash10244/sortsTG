/**
 * ContactGrid.tsx — renders all 4 tier sections (or a flat search list).
 */
import type { Contact, PriceType } from '../../types';
import { TIER_ORDER } from '../../utils/tierUtils';
import { TierSection } from './TierSection';
import { ContactCard } from './ContactCard';

interface ContactGridProps {
  contacts: Contact[];
  isSearching: boolean;
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
  onView: (c: Contact) => void;
}

export function ContactGrid({ contacts, isSearching, onEdit, onDelete, onView }: ContactGridProps) {
  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">🔍</span>
        <p className="empty-state__text">
          {isSearching ? 'No contacts match your search.' : 'No contacts yet. Add your first one!'}
        </p>
      </div>
    );
  }

  // Flat list when searching
  if (isSearching) {
    return (
      <div className="contact-grid--search">
        <p className="search-result-label">{contacts.length} result{contacts.length !== 1 ? 's' : ''}</p>
        <div className="card-grid">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onEdit={onEdit} onDelete={onDelete} onView={onView} />
          ))}
        </div>
      </div>
    );
  }

  // Sectioned view
  const byTier: Record<PriceType, Contact[]> = {
    budget: [],
    midrange: [],
    premium: [],
    models: [],
  };
  contacts.forEach(c => byTier[c.priceType].push(c));

  return (
    <div className="contact-grid">
      {TIER_ORDER.map(tier => (
        <TierSection
          key={tier}
          tier={tier}
          contacts={byTier[tier]}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}
