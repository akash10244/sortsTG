/**
 * ContactCard.tsx — compact contact card.
 * - ageType and tier badge removed from display
 * - Review: single line with ellipsis, click to expand
 */
import { useState } from 'react';
import type { Contact } from '../../types';
import { formatPrices } from '../../utils/tierUtils';
import { ImageCarousel } from './ImageCarousel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const handleContact = () => {
    if (contact.contactType === 'phone') {
      window.open(`https://wa.me/${contact.contactValue.replace(/\D/g, '')}`, '_blank');
    } else {
      const handle = contact.contactValue.replace(/^@/, '');
      window.open(`https://t.me/${handle}`, '_blank');
    }
  };

  return (
    <div className={`card ${!contact.isActive ? 'card--inactive' : ''}`}>
      <div className="card__carousel">
        <ImageCarousel fileIds={contact.imageFileIds} />
        {!contact.isActive && (
          <div className="card__status">
            <Badge label="Inactive" variant="inactive" />
          </div>
        )}
      </div>

      <div className="card__body">
        {/* Name + age + ageType */}
        <div className="card__name-row">
          <span className="card__name">{contact.name}</span>
          <span className="card__age">{contact.age} · {contact.ageType}</span>
        </div>

        {/* Location */}
        {contact.location && (
          <div className="card__meta">
            <span className="card__meta-icon">📍</span>
            <span>{contact.location}</span>
          </div>
        )}

        {/* All price entries */}
        <div className="card__meta">
          <span className="card__meta-icon">💰</span>
          <span className="card__price">{formatPrices(contact.prices)}</span>
        </div>

        {/* Contact deep-link */}
        <button className="card__contact" onClick={handleContact}>
          {contact.contactType === 'phone' ? (
            <>
              <span>📱</span>
              <span>{contact.contactValue}</span>
            </>
          ) : (
            <>
              <span>✈️</span>
              <span>@{contact.contactValue.replace(/^@/, '')}</span>
            </>
          )}
        </button>

        {/* Review — one line truncated, click to expand */}
        {contact.reviewText && (
          <button
            className={`card__review ${reviewExpanded ? 'card__review--expanded' : ''}`}
            onClick={() => setReviewExpanded(e => !e)}
            title={reviewExpanded ? undefined : contact.reviewText}
          >
            <span className="card__review-icon">★</span>
            <span className="card__review-text">{contact.reviewText}</span>
            {reviewExpanded && <span className="card__review-less">↑ less</span>}
          </button>
        )}
      </div>

      <div className="card__footer">
        <Button size="sm" variant="ghost" onClick={() => onEdit(contact)}>✏️</Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(contact)}>🗑️</Button>
      </div>
    </div>
  );
}
