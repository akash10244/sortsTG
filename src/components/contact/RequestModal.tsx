/**
 * RequestModal.tsx
 *
 * Modal form allowing a user to request contact & review details for a shared contact.
 * Asks for a reason/message and submits a ContactRequest to Firestore.
 */
import { useState } from 'react';
import type { Contact } from '../../types';
import { createContactRequest } from '../../services/firebaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatPrices } from '../../utils/tierUtils';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  currentUserUid: string;
  currentUserEmail: string;
}

export function RequestModal({
  isOpen,
  onClose,
  contact,
  currentUserUid,
  currentUserEmail,
}: RequestModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg) {
      setError('Please provide a message explaining your request.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createContactRequest({
        requesterId: currentUserUid,
        requesterEmail: currentUserEmail,
        ownerId: contact.ownerId || '',
        originalContactId: contact.originalContactId || contact.id,
        contactName: contact.name,
        message: cleanMsg,
      });
      setIsSuccess(true);
      setMessage('');
    } catch (err: any) {
      console.error('Failed to submit contact request:', err);
      setError(err.message ?? 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    setMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Contact Details" width="sm">
      {isSuccess ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            fontSize: '3rem',
            color: '#10b981',
            marginBottom: '15px'
          }}>
            ✓
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
            Request Sent Successfully!
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Your request for <strong>{contact.name}</strong> has been sent to the owner. They will review your message and reach out.
          </p>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form">
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px var(--sp-4)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem', marginBottom: '4px' }}>
              {contact.name}
            </div>
            <div>💰 Tier: {contact.priceType.toUpperCase()} ({formatPrices(contact.prices)})</div>
            {contact.location && <div>📍 Location: {contact.location}</div>}
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label" htmlFor="request-message">
              Why do you want this contact and what do you need it for?
            </label>
            <textarea
              id="request-message"
              className={`form-input form-textarea ${error ? 'form-input--error' : ''}`}
              placeholder="Explain why you are requesting this contact details and review..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              rows={4}
              required
            />
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="form-footer" style={{ marginTop: '10px' }}>
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Send Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
