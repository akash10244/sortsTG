/**
 * SettingsModal.tsx — tabbed modal for AgeTypes, TierBoundaries, and Account Data Transfer.
 */
import { useState } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import { uploadToImageKit, deleteFromImageKit } from '../../services/imagekitService';
import type { AppConfig, Contact } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AgeTypeManager } from './AgeTypeManager';
import { TierBoundaryEditor } from './TierBoundaryEditor';

type Tab = 'ageTypes' | 'tiers' | 'transfer' | 'optimize';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  contacts: Contact[];
  userId: string;
  onSave: (config: AppConfig) => Promise<void>;
  isSaving: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  config,
  contacts,
  userId,
  onSave,
  isSaving,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('ageTypes');
  const [draft, setDraft] = useState<AppConfig>(config);

  // Transfer State
  const [targetUid, setTargetUid] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });

  // Optimization State
  const [optimizeStatus, setOptimizeStatus] = useState<{
    type: 'success' | 'error' | 'idle' | 'running';
    message: string;
    currentImageIndex?: number;
    totalImages?: number;
    contactName?: string;
  }>({ type: 'idle', message: '' });

  // Sync draft when modal opens
  const handleOpen = () => {
    setDraft(config);
    setTab('ageTypes');
    setTargetUid('');
    setTransferStatus({ type: 'idle', message: '' });
    setOptimizeStatus({ type: 'idle', message: '' });
  };

  const handleTransfer = async () => {
    const cleanTarget = targetUid.trim();
    if (!cleanTarget) {
      setTransferStatus({ type: 'error', message: 'Please enter a valid target User ID.' });
      return;
    }
    if (cleanTarget === userId) {
      setTransferStatus({ type: 'error', message: 'Target User ID cannot be the same as your current ID.' });
      return;
    }

    setTransferring(true);
    setTransferStatus({ type: 'idle', message: '' });

    try {
      // 1. Copy config settings document
      const configRef = doc(db, 'users', userId, 'config', 'settings');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const targetConfigRef = doc(db, 'users', cleanTarget, 'config', 'settings');
        await setDoc(targetConfigRef, configSnap.data());
      }

      // 2. Copy all contacts
      const contactsRef = collection(db, 'users', userId, 'contacts');
      const contactsSnap = await getDocs(contactsRef);

      const batch = writeBatch(db);
      contactsSnap.forEach((contactDoc) => {
        const targetContactRef = doc(db, 'users', cleanTarget, 'contacts', contactDoc.id);
        batch.set(targetContactRef, contactDoc.data());
      });
      await batch.commit();

      // 3. Mark migration as complete for the target user ID
      const targetMigrationRef = doc(db, 'users', cleanTarget, 'config', 'migration');
      await setDoc(targetMigrationRef, {
        completed: true,
        completedAt: new Date().toISOString(),
        transferredFrom: userId,
      });

      setTransferStatus({
        type: 'success',
        message: `Successfully transferred all data and configuration to User ID: ${cleanTarget}!`,
      });
      setTargetUid('');
    } catch (err: any) {
      console.error('Data transfer failed:', err);
      setTransferStatus({
        type: 'error',
        message: err.message ?? 'Failed to transfer database documents.',
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleOptimizeImages = async () => {
    // 1. Scan all contacts for ImageKit images
    const imageList: {
      contact: Contact;
      url: string;
      kitId: string;
      imageIndex: number;
    }[] = [];

    contacts.forEach((contact) => {
      const urls = contact.imageUrls || [];
      const kitIds = contact.imageKitIds || [];
      urls.forEach((url, index) => {
        if (url.includes('imagekit.io') && kitIds[index]) {
          imageList.push({
            contact,
            url,
            kitId: kitIds[index],
            imageIndex: index,
          });
        }
      });
    });

    if (imageList.length === 0) {
      setOptimizeStatus({
        type: 'error',
        message: 'No ImageKit images found to optimize.',
      });
      return;
    }

    setOptimizeStatus({
      type: 'running',
      message: `Starting optimization for ${imageList.length} images...`,
      currentImageIndex: 0,
      totalImages: imageList.length,
      contactName: '',
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < imageList.length; i++) {
      const { contact, url, kitId } = imageList[i];
      
      setOptimizeStatus({
        type: 'running',
        message: `Processing image ${i + 1} of ${imageList.length}...`,
        currentImageIndex: i + 1,
        totalImages: imageList.length,
        contactName: contact.name,
      });

      try {
        // A. Fetch pre-resized image from ImageKit on the fly (1200px width limit, q=80)
        const cleanUrl = url.split('?')[0];
        const separator = cleanUrl.includes('?') ? '&' : '?';
        const resizedUrl = `${cleanUrl}${separator}tr=w-1200,q-80`;

        const res = await fetch(resizedUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch resized image from CDN: ${res.statusText}`);
        }
        const blob = await res.blob();

        // B. Re-upload optimized file to ImageKit
        const cleanName = contact.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_opt_${cleanName}.jpg`;
        const uploadResult = await uploadToImageKit(blob, fileName);

        // C. Fetch fresh contact document to avoid race conditions or dirty state
        const contactRef = doc(db, 'users', userId, 'contacts', contact.id);
        const contactSnap = await getDoc(contactRef);
        if (!contactSnap.exists()) {
          throw new Error('Contact document no longer exists');
        }

        const freshContact = contactSnap.data() as Contact;
        const freshUrls = [...(freshContact.imageUrls || [])];
        const freshKitIds = [...(freshContact.imageKitIds || [])];

        const oldIndex = freshKitIds.indexOf(kitId);
        if (oldIndex !== -1) {
          freshUrls[oldIndex] = uploadResult.url;
          freshKitIds[oldIndex] = uploadResult.fileId;
        } else {
          freshUrls.push(uploadResult.url);
          freshKitIds.push(uploadResult.fileId);
        }

        freshContact.imageUrls = freshUrls;
        freshContact.imageKitIds = freshKitIds;
        freshContact.updatedAt = new Date().toISOString();

        // Save back to Firestore
        await setDoc(contactRef, freshContact);

        // D. Delete the old unoptimized image from ImageKit
        await deleteFromImageKit(kitId).catch((err) => {
          console.warn(`Failed to delete old image ${kitId} from ImageKit:`, err);
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to optimize image for ${contact.name}:`, err);
        failCount++;
      }
    }

    setOptimizeStatus({
      type: 'success',
      message: `Image optimization complete! Successfully compressed ${successCount} images. ${
        failCount > 0 ? `Failed to process ${failCount} images.` : ''
      }`,
      currentImageIndex: imageList.length,
      totalImages: imageList.length,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="md">
      <div className="settings-modal" onFocus={() => { if (!draft) handleOpen(); }}>
        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${tab === 'ageTypes' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('ageTypes')}
          >
            Age Types
          </button>
          <button
            className={`settings-tab ${tab === 'tiers' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('tiers')}
          >
            Tier Boundaries
          </button>
          <button
            className={`settings-tab ${tab === 'transfer' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('transfer')}
          >
            Data Transfer
          </button>
          <button
            className={`settings-tab ${tab === 'optimize' ? 'settings-tab--active' : ''}`}
            onClick={() => setTab('optimize')}
          >
            Optimize Images
          </button>
        </div>

        {/* Tab content */}
        <div className="settings-content">
          {tab === 'ageTypes' && (
            <AgeTypeManager
              ageTypes={draft.ageTypes}
              contacts={contacts}
              onChange={types => setDraft(d => ({ ...d, ageTypes: types }))}
            />
          )}
          {tab === 'tiers' && (
            <TierBoundaryEditor
              boundaries={draft.tierBoundaries}
              onChange={b => setDraft(d => ({ ...d, tierBoundaries: b }))}
            />
          )}
          {tab === 'transfer' && (
            <div style={{ padding: '10px 0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text)' }}>
                Transfer Data to Another Account
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Copy all contacts and settings from your current account to another Google account's Firebase ID. Useful if you migrated Drive files under one login but want to use the database under another private login.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Your Current User ID
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={userId}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      width: '100%',
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userId);
                      alert('User ID copied to clipboard!');
                    }}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target User ID
                </label>
                <input
                  type="text"
                  placeholder="Paste target account User ID here…"
                  value={targetUid}
                  onChange={e => setTargetUid(e.target.value)}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    width: '100%',
                  }}
                  disabled={transferring}
                />
              </div>

              {transferStatus.type !== 'idle' && (
                <div style={{
                  background: transferStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--red-bg)',
                  border: transferStatus.type === 'success' ? '1px solid rgb(16, 185, 129)' : '1px solid var(--red)',
                  color: transferStatus.type === 'success' ? '#34d399' : 'var(--red)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}>
                  {transferStatus.message}
                </div>
              )}

              <button
                type="button"
                onClick={handleTransfer}
                disabled={transferring}
                style={{
                  background: transferring ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: transferring ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: transferring ? 'none' : '0 4px 12px var(--accent-glow)',
                }}
              >
                {transferring ? '⏳ Transferring Documents…' : '🚀 Copy All Data'}
              </button>
            </div>
          )}
          {tab === 'optimize' && (
            <div style={{ padding: '10px 0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text)' }}>
                Image Optimization & Compression
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Compress all existing contact photos currently stored on the ImageKit CDN. This process downloads a pre-optimized 1200px version of each photo from the CDN, re-uploads it as the primary image, and deletes the old unoptimized version (which could be up to 10MB). This ensures much faster loading when viewing images and reduces CDN storage usage.
              </p>

              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 15px',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Total Contacts:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{contacts.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Contacts with ImageKit photos:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {contacts.filter(c => c.imageUrls && c.imageUrls.some(url => url.includes('imagekit.io'))).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total ImageKit images:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {contacts.reduce((acc, c) => acc + (c.imageUrls || []).filter(url => url.includes('imagekit.io')).length, 0)}
                  </span>
                </div>
              </div>

              {optimizeStatus.type === 'running' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>
                      {optimizeStatus.contactName ? `Optimizing for ${optimizeStatus.contactName}...` : 'Starting...'}
                    </span>
                    <span>
                      {optimizeStatus.currentImageIndex} / {optimizeStatus.totalImages}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--bg-main)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${((optimizeStatus.currentImageIndex || 0) / (optimizeStatus.totalImages || 1)) * 100}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {optimizeStatus.message}
                  </div>
                </div>
              )}

              {optimizeStatus.type !== 'idle' && optimizeStatus.type !== 'running' && (
                <div style={{
                  background: optimizeStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--red-bg)',
                  border: optimizeStatus.type === 'success' ? '1px solid rgb(16, 185, 129)' : '1px solid var(--red)',
                  color: optimizeStatus.type === 'success' ? '#34d399' : 'var(--red)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  marginBottom: '1.5rem',
                }}>
                  {optimizeStatus.message}
                </div>
              )}

              <button
                type="button"
                onClick={handleOptimizeImages}
                disabled={optimizeStatus.type === 'running'}
                style={{
                  background: optimizeStatus.type === 'running' ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: optimizeStatus.type === 'running' ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: optimizeStatus.type === 'running' ? 'none' : '0 4px 12px var(--accent-glow)',
                }}
              >
                {optimizeStatus.type === 'running' ? '⏳ Optimizing Images...' : '🖼️ Compress Existing Photos'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="form-footer">
          <Button variant="ghost" onClick={onClose} disabled={isSaving || transferring || optimizeStatus.type === 'running'}>Cancel</Button>
          {tab !== 'transfer' && tab !== 'optimize' && (
            <Button variant="primary" onClick={() => onSave(draft)} loading={isSaving}>
              Save settings
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
