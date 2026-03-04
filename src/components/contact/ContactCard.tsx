/**
 * ContactCard.tsx — horizontal compact card.
 * Photo on left, content on right. Target height ~90px.
 */
import { useState } from 'react';
import type { Contact } from '../../types';
import { formatPrices } from '../../utils/tierUtils';
import { DriveImage } from '../ui/DriveImage';
import { Lightbox } from '../ui/Lightbox';
import { Badge } from '../ui/Badge';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onView: (contact: Contact) => void;
}

export function ContactCard({ contact, onEdit, onDelete, onView }: ContactCardProps) {
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleContact = () => {
    if (contact.contactType === 'phone') {
      // wa.me usually handles _blank fine, but we can use _self to be safe as well
      window.open(`https://wa.me/${contact.contactValue.replace(/\D/g, '')}`, '_self');
    } else {
      const handle = contact.contactValue.replace(/^@/, '');
      window.open(`https://t.me/${handle}`, '_self');
    }
  };

  const hasImages = contact.imageFileIds.length > 0;

  return (
    <div className={`card ${!contact.isActive ? 'card--inactive' : ''}`}>

      {/* ── Left: photo thumbnail ─────────────────────────────────── */}
      <div className="card__photo" onClick={() => hasImages && setLightboxOpen(true)}>
        {hasImages ? (
          <>
            <DriveImage
              fileId={contact.imageFileIds[0]}
              alt={contact.name}
              className="card__photo-img"
            />
            {contact.imageFileIds.length > 1 && (
              <span className="card__photo-count">+{contact.imageFileIds.length - 1}</span>
            )}
          </>
        ) : (
          <div className="card__photo-empty">👤</div>
        )}
        {!contact.isActive && (
          <div className="card__photo-badge">
            <Badge label="Off" variant="inactive" />
          </div>
        )}
      </div>

      {/* ── Right: content ────────────────────────────────────────── */}
      <div className="card__content" onClick={() => onView(contact)} style={{ cursor: 'pointer' }}>
        {/* Row 1: name + age/type + actions */}
        <div className="card__top-row">
            <h3 className="card__name" title={contact.name}>{contact.name}</h3>
            {(contact.age || contact.ageType) && (
              <span className="card__age">
               {contact.age ? contact.age + ' ·' : ''} {contact.ageType ? `${contact.ageType}` : ''}
              </span>
            )}
            {contact.isLessInterested && <Badge label="Less Int." variant="active" />}
            {contact.didntExplorex && <Badge label="No Exp" variant="inactive" />}
            <div className="card__actions">
            <button className="card__action-btn" onClick={(e) => { e.stopPropagation(); onEdit(contact); }} aria-label="Edit">✏️</button>
            <button className="card__action-btn card__action-btn--del" onClick={(e) => { e.stopPropagation(); onDelete(contact); }} aria-label="Delete">🗑️</button>
          </div>
        </div>

        {/* Row 2: price */}
        <div className="card__row">
          <span className="card__price">💰 {formatPrices(contact.prices)}</span>
        </div>

        {/* Row 3: contact link */}
        <button className="card__contact" onClick={(e) => { e.stopPropagation(); handleContact(); }}>
          {contact.contactType === 'phone' ? `📱 ${contact.contactValue}` : `✈️ @${contact.contactValue.replace(/^@/, '')}`}
        </button>

        {/* Row 4: location + review (one line each) */}
        {contact.location && (
          <div className="card__row card__location">📍 {contact.location}</div>
        )}

        {contact.reviewText && (
          <button
            className={`card__review ${reviewExpanded ? 'card__review--expanded' : ''}`}
            onClick={(e) => { e.stopPropagation(); setReviewExpanded(v => !v); }}
            title={reviewExpanded ? undefined : contact.reviewText}
          >
            <span className="card__review-icon">★</span>
            <span className="card__review-text">{contact.reviewText}</span>
            {reviewExpanded && <span className="card__review-less">↑ less</span>}
          </button>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox fileIds={contact.imageFileIds} startIndex={0} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
