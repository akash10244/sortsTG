/**
 * SharedPoolsExplorer.tsx
 *
 * Browses all publicly pooled contacts from other users.
 * Groups contacts by owner email, renders them in collapsible grids,
 * and restricts private details (no zoom, no contact links, no reviews)
 * with a "Request Details" CTA.
 */
import { useEffect, useState } from 'react';
import type { Contact, ContactRequest } from '../../types';
import { fetchPooledContacts } from '../../services/firebaseService';
import { ContactCard } from './ContactCard';
import { RequestModal } from './RequestModal';
import { Spinner } from '../ui/Spinner';

interface SharedPoolsExplorerProps {
  currentUserId: string;
  currentUserEmail: string;
  sentRequests: ContactRequest[];
}

interface OwnerGroup {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  contacts: Contact[];
}

export function SharedPoolsExplorer({
  currentUserId,
  currentUserEmail,
  sentRequests,
}: SharedPoolsExplorerProps) {
  const [groups, setGroups] = useState<OwnerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [requestTarget, setRequestTarget] = useState<Contact | null>(null);
  const [displayLimit, setDisplayLimit] = useState(1);

  // Cache unlocked details (keys are public pooled contact IDs)
  const [unlockedDetails, setUnlockedDetails] = useState<Record<string, { contactValue: string; reviewText: string }>>({});

  useEffect(() => {
    groups.forEach((g) => {
      g.contacts.forEach((c) => {
        // Find if we have an approved request for this contact
        const req = sentRequests.find(
          (r) => r.originalContactId === c.originalContactId && r.ownerId === c.ownerId
        );

        if (c.ownerId && c.originalContactId && req && req.status === 'approved' && !unlockedDetails[c.id]) {
          const ownerId = c.ownerId;
          const origId = c.originalContactId;
          // Fetch private details
          import('../../services/firebaseService').then(({ fetchPrivateContactDoc }) => {
            fetchPrivateContactDoc(ownerId, origId)
              .then((privateContact) => {
                if (privateContact) {
                  setUnlockedDetails((prev) => ({
                    ...prev,
                    [c.id]: {
                      contactValue: privateContact.contactValue,
                      reviewText: privateContact.reviewText,
                    },
                  }));
                }
              })
              .catch((err) => {
                console.error('Failed to fetch unlocked contact details:', err);
              });
          });
        }
      });
    });
  }, [sentRequests, groups, unlockedDetails]);

  const loadSharedPools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allPooled = await fetchPooledContacts();
      
      // Filter out current user's own contacts
      const otherUsersPooled = allPooled.filter((c) => c.ownerId !== currentUserId);

      // Group by ownerId
      const groupedMap: Record<string, OwnerGroup> = {};
      otherUsersPooled.forEach((contact) => {
        const ownerId = contact.ownerId || 'unknown';
        if (!groupedMap[ownerId]) {
          groupedMap[ownerId] = {
            ownerId,
            ownerEmail: contact.ownerEmail || 'Unknown User',
            ownerName: contact.ownerName || 'Anonymous',
            contacts: [],
          };
        }
        groupedMap[ownerId].contacts.push(contact);
      });

      const list = Object.values(groupedMap).sort((a, b) =>
        a.ownerEmail.localeCompare(b.ownerEmail)
      );
      setGroups(list);
      setDisplayLimit(1);

      // Expand the first group by default if available
      if (list.length > 0) {
        setExpandedGroups(new Set([list[0].ownerId]));
      }
    } catch (err: any) {
      console.error('Failed to load shared pools:', err);
      setError(err.message ?? 'Failed to load shared contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSharedPools();
  }, [currentUserId]);

  const toggleGroup = (ownerId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(ownerId)) {
        next.delete(ownerId);
      } else {
        next.add(ownerId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="app-loading" style={{ minHeight: '300px' }}>
        <Spinner size="md" />
        <p>Fetching shared contacts from CDN…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '40px var(--sp-4)' }}>
        <span className="empty-state__icon">⚠️</span>
        <p className="empty-state__text" style={{ color: 'var(--red)' }}>{error}</p>
        <button
          onClick={loadSharedPools}
          className="btn btn--outline btn--sm"
          style={{ marginTop: '12px' }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '60px var(--sp-4)' }}>
        <span className="empty-state__icon">👥</span>
        <p className="empty-state__text">
          No shared pools found from other users.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          When other users pool their contacts, they will appear here!
        </p>
      </div>
    );
  }

  return (
    <div className="shared-pools-explorer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div style={{ marginBottom: '4px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
          Shared Contacts Directory
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
          Browse contact profiles pooled by other users. Send requests to unlock private numbers and reviews.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {groups.slice(0, displayLimit).map((group) => {
          const isExpanded = expandedGroups.has(group.ownerId);
          return (
            <div key={group.ownerId} className="shared-group-section" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'border-color var(--t-fast)'
            }}>
              <div
                onClick={() => toggleGroup(group.ownerId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-elevated)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>👤</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
                    {group.ownerEmail}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-muted)'
                  }}>
                    {group.contacts.length} shared
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform var(--t-normal)'
                }}>
                  ▼
                </span>
              </div>

              {isExpanded && (
                <div style={{ padding: '16px', background: 'var(--bg-card)' }}>
                  <div className="card-grid" style={{ margin: 0 }}>
                    {group.contacts.map((contact) => {
                      const request = sentRequests.find(
                        (r) => r.originalContactId === contact.originalContactId && r.ownerId === contact.ownerId
                      );
                      const status = request?.status;
                      const unlocked = unlockedDetails[contact.id];

                      return (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onView={() => {}}
                          isSharedView={true}
                          onRequestClick={() => setRequestTarget(contact)}
                          requestStatus={status}
                          unlockedContactValue={unlocked?.contactValue}
                          unlockedReviewText={unlocked?.reviewText}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayLimit < groups.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button
            className="btn btn--ghost btn--md"
            onClick={() => setDisplayLimit((prev) => Math.min(prev + 5, groups.length))}
            style={{
              padding: '10px 32px',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-full)',
              borderColor: 'var(--accent)',
              color: 'var(--accent-light)',
              fontWeight: 600,
              gap: '6px'
            }}
          >
            ➕ Load More Users ({groups.length - displayLimit} remaining)
          </button>
        </div>
      )}

      <RequestModal
        isOpen={requestTarget !== null}
        onClose={() => setRequestTarget(null)}
        contact={requestTarget}
        currentUserUid={currentUserId}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
