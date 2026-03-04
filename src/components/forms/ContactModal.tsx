/**
 * ContactModal.tsx — full add/edit contact form.
 * Price is now a list of PriceEntry items (amount + duration + unit).
 */
import { useState, useEffect } from 'react';
import type { Contact, AppConfig, ContactType, PriceEntry, PriceType } from '../../types';
import { TIER_LABELS } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageUploader, type PendingImage } from './ImageUploader';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  config: AppConfig;
  mode?: 'add' | 'edit' | 'view';
  onSave: (
    draft: ContactDraftFields,
    newFiles: File[],
    removedFileIds: string[],
    original: Contact | null
  ) => Promise<void>;
}

export interface ContactDraftFields {
  name: string;
  age: number;
  ageType: string;
  contactType: ContactType;
  contactValue: string;
  location: string;
  reviewText: string;
  prices: PriceEntry[];
  priceType: PriceType;  // set manually by user
  isActive: boolean;
}

const EMPTY_PRICE_ENTRY: PriceEntry = { amount: 0, duration: 1, durationUnit: 'shots' };

const EMPTY_DRAFT: ContactDraftFields = {
  name: '',
  age: 18,
  ageType: '',
  contactType: 'phone',
  contactValue: '',
  location: '',
  reviewText: '',
  prices: [{ ...EMPTY_PRICE_ENTRY }],
  priceType: 'budget',
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
    prices: c.prices.length ? c.prices : [{ ...EMPTY_PRICE_ENTRY }],
    priceType: c.priceType,
    isActive: c.isActive,
  };
}

export function ContactModal({ isOpen, onClose, contact, config, mode = 'edit', onSave }: ContactModalProps) {
  const [draft, setDraft] = useState<ContactDraftFields>(EMPTY_DRAFT);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const isView = mode === 'view';
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(contact
        ? draftFromContact(contact)
        : { ...EMPTY_DRAFT, ageType: config.ageTypes[0] ?? '', prices: [{ ...EMPTY_PRICE_ENTRY }], priceType: 'budget' }
      );
      setPendingImages([]);
      setRemovedFileIds([]);
      setErrors({});
    }
  }, [isOpen, contact, config.ageTypes]);

  const set = <K extends keyof ContactDraftFields>(key: K, value: ContactDraftFields[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  // ── Price entry helpers ──────────────────────────────────────────────────
  const updatePrice = (idx: number, patch: Partial<PriceEntry>) =>
    setDraft(d => ({
      ...d,
      prices: d.prices.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));

  const addPriceEntry = () =>
    setDraft(d => ({ ...d, prices: [...d.prices, { ...EMPTY_PRICE_ENTRY }] }));

  const removePriceEntry = (idx: number) =>
    setDraft(d => ({ ...d, prices: d.prices.filter((_, i) => i !== idx) }));

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {};
    if (!draft.name.trim()) e.name = 'Name is required';
    if (!draft.age || draft.age < 18) e.age = 'Age must be ≥ 18';
    if (!draft.contactValue.trim()) e.contactValue = 'Contact is required';
    if (!draft.prices.length) e.prices = 'Add at least one price entry';
    draft.prices.forEach((p, i) => {
      if (!p.amount || p.amount <= 0) e[`price_${i}`] = 'Enter a valid amount';
      if (!p.duration || p.duration <= 0) e[`duration_${i}`] = 'Enter a valid duration';
    });
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


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isView ? 'Contact Details' : contact ? 'Edit Contact' : 'Add Contact'}
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
            readOnly={isView}
          />
        </div>

        <div className="form-row">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="cf-name">Name *</label>
            <input id="cf-name" className={`form-input ${errors.name ? 'form-input--error' : ''}`} value={draft.name} onChange={e => set('name', e.target.value)} placeholder="Full name" disabled={isView} />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          {/* Age */}
          <div className="form-group form-group--sm">
            <label className="form-label" htmlFor="cf-age">Age *</label>
            <input id="cf-age" type="number" min={18} className={`form-input ${errors.age ? 'form-input--error' : ''}`} value={draft.age} onChange={e => set('age', Number(e.target.value))} disabled={isView} />
            {errors.age && <p className="form-error">{errors.age}</p>}
          </div>
          {/* Age Type */}
          <div className="form-group form-group--sm">
            <label className="form-label" htmlFor="cf-agetype">Age Type</label>
            <select id="cf-agetype" className="form-input" value={draft.ageType} onChange={e => set('ageType', e.target.value)} disabled={isView}>
              {config.ageTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          {/* Contact type */}
          <div className="form-group form-group--sm">
            <label className="form-label">Contact via</label>
            <div className="form-toggle-group">
              <button type="button" className={`form-toggle-btn ${draft.contactType === 'phone' ? 'form-toggle-btn--active' : ''}`} onClick={() => set('contactType', 'phone')} disabled={isView}>📱 WhatsApp</button>
              <button type="button" className={`form-toggle-btn ${draft.contactType === 'telegram' ? 'form-toggle-btn--active' : ''}`} onClick={() => set('contactType', 'telegram')} disabled={isView}>✈️ Telegram</button>
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
              disabled={isView}
            />
            {errors.contactValue && <p className="form-error">{errors.contactValue}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label" htmlFor="cf-location">Location</label>
          <input id="cf-location" className="form-input" value={draft.location} onChange={e => set('location', e.target.value)} placeholder="City / area" disabled={isView} />
        </div>

        {/* ── Price entries ──────────────────────────────────────────────── */}
        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">Pricing *</label>
          </div>

          {errors.prices && <p className="form-error">{errors.prices}</p>}

          {draft.prices.map((entry, idx) => (
            <div key={idx} className="price-entry">
              <div className="form-group form-group--sm">
                <label className="form-label" htmlFor={`cf-amount-${idx}`}>₹ Amount</label>
                <input
                  id={`cf-amount-${idx}`}
                  type="number"
                  min={0}
                  className={`form-input ${errors[`price_${idx}`] ? 'form-input--error' : ''}`}
                  value={entry.amount || ''}
                  onChange={e => updatePrice(idx, { amount: Number(e.target.value) })}
                  placeholder="13000"
                  disabled={isView}
                />
                {errors[`price_${idx}`] && <p className="form-error">{errors[`price_${idx}`]}</p>}
              </div>

              <div className="form-group form-group--sm">
                <label className="form-label" htmlFor={`cf-dur-${idx}`}>Duration</label>
                <input
                  id={`cf-dur-${idx}`}
                  type="number"
                  min={1}
                  className={`form-input ${errors[`duration_${idx}`] ? 'form-input--error' : ''}`}
                  value={entry.duration || ''}
                  onChange={e => updatePrice(idx, { duration: Number(e.target.value) })}
                  placeholder="2"
                  disabled={isView}
                />
                {errors[`duration_${idx}`] && <p className="form-error">{errors[`duration_${idx}`]}</p>}
              </div>

              <div className="form-group form-group--sm">
                <label className="form-label">Unit</label>
                <div className="form-toggle-group">
                  <button type="button" className={`form-toggle-btn ${entry.durationUnit === 'shots' ? 'form-toggle-btn--active' : ''}`} onClick={() => updatePrice(idx, { durationUnit: 'shots' })} disabled={isView}>shots</button>
                  <button type="button" className={`form-toggle-btn ${entry.durationUnit === 'hrs' ? 'form-toggle-btn--active' : ''}`} onClick={() => updatePrice(idx, { durationUnit: 'hrs' })} disabled={isView}>hrs</button>
                </div>
              </div>

              {!isView && (
                <div className="price-entry__actions">
                  {draft.prices.length > 1 && (
                    <button type="button" className="price-entry__remove" onClick={() => removePriceEntry(idx)} aria-label="Remove entry">✕</button>
                  )}
                </div>
              )}
            </div>
          ))}

          {!isView && (
            <button type="button" className="price-add-btn" onClick={addPriceEntry}>
              ＋ Add another price
            </button>
          )}
        </div>

        {/* Tier — manual selection */}
        <div className="form-group">
          <label className="form-label">Tier</label>
          <div className="tier-chips tier-chips--select">
            {(['budget', 'midrange', 'premium', 'models'] as PriceType[]).map(t => (
              <button
                key={t}
                type="button"
                className={`tier-chip tier-chip--${t} ${draft.priceType === t ? 'tier-chip--active' : ''}`}
                onClick={() => set('priceType', t)}
                disabled={isView}
              >
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="form-group">
          <label className="form-label" htmlFor="cf-review">Review</label>
          <textarea id="cf-review" className="form-input form-textarea" value={draft.reviewText} onChange={e => set('reviewText', e.target.value)} placeholder="Short review…" rows={3} disabled={isView} />
        </div>

        {/* Active */}
        <div className="form-group form-group--inline">
          <label className="form-label" htmlFor="cf-active">Active</label>
          <input id="cf-active" type="checkbox" className="form-checkbox" checked={draft.isActive} onChange={e => set('isActive', e.target.checked)} disabled={isView} />
        </div>

        {/* Footer */}
        <div className="form-footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>{isView ? 'Close' : 'Cancel'}</Button>
          {!isView && (
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {contact ? 'Save changes' : 'Add contact'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
