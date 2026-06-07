/**
 * ContactCard.tsx — horizontal compact card.
 * Photo on left, content on right. Target height ~90px.
 */
import { useState } from 'react';
import type { Contact } from '../../types';
import { formatPrices } from '../../utils/tierUtils';
import { ContactImage } from '../ui/ContactImage';
import { Lightbox } from '../ui/Lightbox';
import { Badge } from '../ui/Badge';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onView: (contact: Contact) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (contactId: string) => void;
  isSharedView?: boolean;
  onRequestClick?: () => void;
  requestStatus?: 'pending' | 'approved' | 'rejected';
  unlockedContactValue?: string;
  unlockedReviewText?: string;
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onView,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  isSharedView = false,
  onRequestClick,
  requestStatus,
  unlockedContactValue,
  unlockedReviewText,
}: ContactCardProps) {
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isUnlocked = isSharedView && requestStatus === 'approved';
  const showPrivateDetails = !isSharedView || isUnlocked;

  const displayContactValue = isUnlocked ? (unlockedContactValue ?? contact.contactValue) : contact.contactValue;
  const displayReviewText = isUnlocked ? (unlockedReviewText ?? contact.reviewText) : contact.reviewText;

  const handleContact = () => {
    if (!displayContactValue) return;
    if (contact.contactType === 'phone') {
      window.open(`https://wa.me/${displayContactValue.replace(/\D/g, '')}`, '_self');
    } else {
      const handle = displayContactValue.replace(/^@/, '');
      window.open(`https://t.me/${handle}`, '_self');
    }
  };

  const driveIds = contact.imageFileIds ?? [];
  const imageUrls = contact.imageUrls ?? [];
  const hasUrls = imageUrls.length > 0;

  // Prioritize ImageKit URLs and ignore Drive IDs if already migrated
  const activeUrls = hasUrls ? imageUrls : [];
  const activeDriveIds = hasUrls ? [] : driveIds;

  const imageCount = activeUrls.length + activeDriveIds.length;
  const hasImages = imageCount > 0;

  // Primary image props
  const primaryUrl = activeUrls.length > 0 ? activeUrls[0] : undefined;
  const primaryFileId = activeDriveIds.length > 0 ? activeDriveIds[0] : undefined;

  return (
    <div className={`card ${!contact.isActive ? 'card--inactive' : ''} ${isSelected ? 'card--selected' : ''}`}>
      {isSelectionMode && (
        <div
          className={`card__selection-overlay ${isSelected ? 'card__selection-overlay--selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(contact.id);
          }}
        >
          <div className="card__selection-checkbox">
            {isSelected ? '✓' : ''}
          </div>
        </div>
      )}

      {/* ── Left: photo thumbnail ─────────────────────────────────── */}
      <div
        className="card__photo"
        style={{ cursor: showPrivateDetails ? 'pointer' : 'default' }}
        onClick={() => !isSelectionMode && showPrivateDetails && hasImages && setLightboxOpen(true)}
      >
        {hasImages ? (
          <>
            <ContactImage
              url={primaryUrl}
              fileId={primaryFileId}
              alt={contact.name}
              className="card__photo-img"
            />
            {imageCount > 1 && showPrivateDetails && (
              <span className="card__photo-count">+{imageCount - 1}</span>
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
      <div
        className="card__content"
        onClick={() => !isSelectionMode && showPrivateDetails && onView(contact)}
        style={{ cursor: (isSelectionMode || !showPrivateDetails) ? 'default' : 'pointer' }}
      >
        {/* Row 1: name + age/type + actions */}
        <div className="card__top-row">
          <h3 className="card__name" title={contact.name}>{contact.name}</h3>
          {(contact.age || contact.ageType) && (
            <span className="card__age">
              {contact.age ? contact.age + ' ·' : ''} {contact.ageType ? `${contact.ageType}` : ''}
            </span>
          )}
          {isUnlocked && <Badge label="Unlocked" variant="pooled" />}
          {contact.isLessInterested && <Badge label="Less Int." variant="active" />}
          {contact.didntExplorex && <Badge label="No Exp" variant="inactive" />}
          {!isSharedView && (
            <div className="card__actions">
              <button className="card__action-btn" onClick={(e) => { e.stopPropagation(); onEdit(contact); }} aria-label="Edit">✏️</button>
              <button className="card__action-btn card__action-btn--del" onClick={(e) => { e.stopPropagation(); onDelete(contact); }} aria-label="Delete">🗑️</button>
            </div>
          )}
        </div>

        {/* Row 2: price */}
        <div className="card__row">
          <span className="card__price">💰 {formatPrices(contact.prices)}</span>
        </div>

        {/* Row 3: contact link or request buttons */}
        {showPrivateDetails ? (
          displayContactValue ? (
            <button className="card__contact" onClick={(e) => { e.stopPropagation(); handleContact(); }}>
              {contact.contactType === 'phone' ? `📱 ${displayContactValue}` : `✈️ @${displayContactValue.replace(/^@/, '')}`}
            </button>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '4px' }}>
              No contact details available.
            </div>
          )
        ) : (
          <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
            {requestStatus === 'pending' ? (
              <button
                className="btn btn--outline btn--sm"
                disabled
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  cursor: 'default',
                  textAlign: 'center',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)'
                }}
              >
                ⏳ Requested (Pending)
              </button>
            ) : requestStatus === 'rejected' ? (
              <button
                className="btn btn--outline btn--sm"
                disabled
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--red)',
                  cursor: 'default',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                ❌ Request Rejected
              </button>
            ) : (
              <button
                className="btn btn--accent btn--sm"
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px var(--accent-glow)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestClick?.();
                }}
              >
                🤝 Request Details
              </button>
            )}
          </div>
        )}

        {/* Row 4: location + review */}
        {showPrivateDetails && contact.location && (
          <div className="card__row card__location">📍 {contact.location}</div>
        )}

        {showPrivateDetails && displayReviewText && (
          <button
            className={`card__review ${reviewExpanded ? 'card__review--expanded' : ''}`}
            onClick={(e) => { e.stopPropagation(); setReviewExpanded(v => !v); }}
            title={reviewExpanded ? undefined : displayReviewText}
          >
            <span className="card__review-icon">★</span>
            <span className="card__review-text">{displayReviewText}</span>
            {reviewExpanded && <span className="card__review-less">↑ less</span>}
          </button>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          imageUrls={activeUrls}
          fileIds={activeDriveIds}
          startIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
