import { useState } from 'react';
import type { ContactRequest } from '../../types';
import { updateRequestStatus } from '../../services/firebaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface IncomingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ContactRequest[];
}

export function IncomingRequestsModal({
  isOpen,
  onClose,
  requests,
}: IncomingRequestsModalProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setUpdatingId(requestId);
    setError(null);
    try {
      await updateRequestStatus(requestId, action);
    } catch (err: any) {
      console.error(`Failed to ${action} request:`, err);
      setError(err.message ?? `Failed to perform action.`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Sort: pending first, then newest first
  const sortedRequests = [...requests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Requests Manager" width="md">
      {error && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--red)',
          color: 'var(--red)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          marginBottom: '12px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {sortedRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🎉</span>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No incoming access requests found.</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            When others request your pooled contact info, it will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {sortedRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isUpdating = updatingId === req.id;

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  opacity: isUpdating ? 0.7 : 1,
                  transition: 'opacity var(--t-fast)'
                }}
              >
                {/* Header line: requester & status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                      {req.requesterEmail}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {new Date(req.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background:
                        req.status === 'approved'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : req.status === 'rejected'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        req.status === 'approved'
                          ? '#10b981'
                          : req.status === 'rejected'
                          ? '#ef4444'
                          : '#f59e0b',
                      border: `1px solid ${
                        req.status === 'approved'
                          ? '#10b981'
                          : req.status === 'rejected'
                          ? '#ef4444'
                          : '#f59e0b'
                      }`
                    }}
                  >
                    {req.status.toUpperCase()}
                  </span>
                </div>

                {/* Requested contact name */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Request for contact: <strong style={{ color: 'var(--text)' }}>{req.contactName}</strong>
                </div>

                {/* Message reason */}
                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4'
                  }}
                >
                  "{req.message}"
                </div>

                {/* Actions */}
                {isPending && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button
                      variant="ghost"
                      onClick={() => handleAction(req.id, 'rejected')}
                      disabled={updatingId !== null}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        color: 'var(--red)',
                        borderColor: 'rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAction(req.id, 'approved')}
                      disabled={updatingId !== null}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        background: '#10b981',
                        borderColor: '#10b981'
                      }}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
