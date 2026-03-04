/**
 * ContactModal.tsx — full add/edit contact form.
 *
 * Holds all draft state internally. Only commits to parent on Save.
 */
import { useState, useEffect } from 'react';
import type { Contact, AppConfig, ContactType } from '../../types';
import { ALL_TIERS, TIER_LABELS } from '../../types';
import { deriveTier, formatPrice } from '../../utils/tierUtils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageUploader, type PendingImage } from './ImageUploader';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = add mode, Contact = edit mode */
  contact: Contact | null;
  config: AppConfig;
  imagesFolderId: string;
  onSave: (
    draft: ContactDraftFields,
    newFiles: File[],
    removedFileIds: string[],
    original: Contact | null
  ) => Promise<void>;
}

interface ContactDraftFields {
  name: string;
  age: number;
  ageType: string;
  contactType: ContactType;
  contactValue: string;
  location: string;
  reviewText: string;
  price: number;
  isActive: boolean;
}

const EMPTY_DRAFT: ContactDraftFields = {
  name: '',
  age: 18,
  ageType: '',
  contactType: 'phone',
  contactValue: '',
  location: '',
  reviewText: '',
  price: 0,
  isActive: true,
};

function draftFromContact(c: Contact): ContactDraftFields {
  return {
    name: c.name,
    age: c.age,
    ageType: c.ageType,
    contactType: c.contactType,
    contactValue: c.contactValue,
    location: c.location,
    reviewText: c.reviewText,
    price: c.price,
    isActive: c.isActive,
  };
}

export function ContactModal({
  isOpen,
  onClose,
  contact,
  config,
  imagesFolderId: _imagesFolderId,
  onSave,
}: ContactModalProps) {
  const [draft, setDraft] = useState<ContactDraftFields>(EMPTY_DRAFT);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDraftFields, string>>>({});
  const [saving, setSaving] = useState(false);

  // Reset draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft(contact ? draftFromContact(contact) : { ...EMPTY_DRAFT, ageType: config.ageTypes[0] ?? '' });
      setPendingImages([]);
      setRemovedFileIds([]);
      setErrors({});
    }
  }, [isOpen, contact, config.ageTypes]);

  const set = <K extends keyof ContactDraftFields>(key: K, value: ContactDraftFields[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const validate = () => {
    const e: typeof errors = {};
    if (!draft.name.trim()) e.name = 'Name is required';
    if (!draft.age || draft.age < 18) e.age = 'Age must be ≥ 18';
    if (!draft.price || draft.price < 0) e.price = 'Price is required';
    if (!draft.contactValue.trim()) e.contactValue = 'Contact is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(draft, pendingImages.map(p => p.file), removedFileIds, contact);
      onClose();
    } catch (err: any) {
      setErrors({ name: err.message ?? 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const liveTier = deriveTier(draft.price, config.tierBoundaries);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? 'Edit Contact' : 'Add Contact'}
      width="lg"
    >
      <div className="contact-form">
        {/* Images */}
        <div className="form-section">
          <label className="form-label">Photos</label>
          <ImageUploader
            existingFileIds={contact ? contact.imageFileIds.filter(id => !removedFileIds.includes(id)) : []}
            onRemoveExisting={id => setRemovedFileIds(prev => [...prev, id])}
            pendingFiles={pendingImages}
            onPendingChange={setPendingImages}
            uploading={saving}
          />
        </div>

        <div className="form-row">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="cf-name">Name *</label>
            <input id="cf-name" className={`form-input ${errors.name ? 'form-input--error' : ''}`} value={draft.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Age */}
          <div className="form-group form-group--sm">
            <label className="form-label" htmlFor="cf-age">Age *</label>
            <input id="cf-age" type="number" min={18} className={`form-input ${errors.age ? 'form-input--error' : ''}`} value={draft.age} onChange={e => set('age', Number(e.target.value))} />
            {errors.age && <p className="form-error">{errors.age}</p>}
          </div>

          {/* Age type */}
          <div className="form-group form-group--sm">
            <label className="form-label" htmlFor="cf-agetype">Age Type</label>
            <select id="cf-agetype" className="form-input" value={draft.ageType} onChange={e => set('ageType', e.target.value)}>
              {config.ageTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          {/* Contact type */}
          <div className="form-group form-group--sm">
            <label className="form-label">Contact via</label>
            <div className="form-toggle-group">
              <button type="button" className={`form-toggle-btn ${draft.contactType === 'phone' ? 'form-toggle-btn--active' : ''}`} onClick={() => set('contactType', 'phone')}>📱 WhatsApp</button>
              <button type="button" className={`form-toggle-btn ${draft.contactType === 'telegram' ? 'form-toggle-btn--active' : ''}`} onClick={() => set('contactType', 'telegram')}>✈️ Telegram</button>
            </div>
          </div>

          {/* Contact value */}
          <div className="form-group">
            <label className="form-label" htmlFor="cf-contact">
              {draft.contactType === 'phone' ? 'Phone number *' : 'Telegram username *'}
            </label>
            <input
              id="cf-contact"
              className={`form-input ${errors.contactValue ? 'form-input--error' : ''}`}
              value={draft.contactValue}
              onChange={e => set('contactValue', e.target.value)}
              placeholder={draft.contactType === 'phone' ? '+91XXXXXXXXXX' : '@username'}
            />
            {errors.contactValue && <p className="form-error">{errors.contactValue}</p>}
          </div>
        </div>

        <div className="form-row">
          {/* Price */}
          <div className="form-group form-group--sm">
            <label className="form-label" htmlFor="cf-price">Price (₹) *</label>
            <input id="cf-price" type="number" min={0} className={`form-input ${errors.price ? 'form-input--error' : ''}`} value={draft.price || ''} onChange={e => set('price', Number(e.target.value))} placeholder="0" />
            {errors.price && <p className="form-error">{errors.price}</p>}
            {draft.price > 0 && (
              <p className="form-hint">Tier: <strong>{TIER_LABELS[liveTier]}</strong> · {formatPrice(draft.price)}</p>
            )}
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="cf-location">Location</label>
            <input id="cf-location" className="form-input" value={draft.location} onChange={e => set('location', e.target.value)} placeholder="City / area" />
          </div>
        </div>

        {/* Review */}
        <div className="form-group">
          <label className="form-label" htmlFor="cf-review">Review</label>
          <textarea id="cf-review" className="form-input form-textarea" value={draft.reviewText} onChange={e => set('reviewText', e.target.value)} placeholder="Short review…" rows={3} />
        </div>

        {/* Active */}
        <div className="form-group form-group--inline">
          <label className="form-label" htmlFor="cf-active">Active</label>
          <input id="cf-active" type="checkbox" className="form-checkbox" checked={draft.isActive} onChange={e => set('isActive', e.target.checked)} />
        </div>

        {/* Footer */}
        <div className="form-footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {contact ? 'Save changes' : 'Add contact'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
