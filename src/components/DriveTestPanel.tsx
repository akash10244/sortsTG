/**
 * DriveTestPanel.tsx
 *
 * A temporary test panel to verify Drive operations work correctly.
 * Replace with your real UI once everything is confirmed working.
 */

import { useState } from 'react';
import { uploadFile, saveJson, loadJson } from '../services/driveService';

interface DriveTestPanelProps {
  appFolderId: string;
  onLogout: () => void;
}

type Status = { type: 'idle' | 'loading' | 'success' | 'error'; message: string };

export default function DriveTestPanel({ appFolderId, onLogout }: DriveTestPanelProps) {
  const [imageStatus, setImageStatus] = useState<Status>({ type: 'idle', message: '' });
  const [jsonStatus, setJsonStatus] = useState<Status>({ type: 'idle', message: '' });

  // ── Image upload ────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageStatus({ type: 'loading', message: 'Uploading…' });
    try {
      const link = await uploadFile(file, appFolderId);
      setImageStatus({ type: 'success', message: `Uploaded! → ${link}` });
    } catch (err: any) {
      setImageStatus({ type: 'error', message: err.message });
    }
  };

  // ── JSON save ────────────────────────────────────────────────────────────
  const handleJsonSave = async () => {
    setJsonStatus({ type: 'loading', message: 'Saving…' });
    try {
      const payload = { savedAt: new Date().toISOString(), items: [{ name: 'test', value: 42 }] };
      const id = await saveJson('app_data.json', payload, appFolderId);
      setJsonStatus({ type: 'success', message: `Saved! File ID: ${id}` });
    } catch (err: any) {
      setJsonStatus({ type: 'error', message: err.message });
    }
  };

  // ── JSON load ────────────────────────────────────────────────────────────
  const handleJsonLoad = async () => {
    setJsonStatus({ type: 'loading', message: 'Loading…' });
    try {
      const data = await loadJson<Record<string, unknown>>('app_data.json', appFolderId);
      if (data) {
        setJsonStatus({ type: 'success', message: `Loaded: ${JSON.stringify(data, null, 2)}` });
      } else {
        setJsonStatus({ type: 'idle', message: 'No data found at app_data.json.' });
      }
    } catch (err: any) {
      setJsonStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div style={{
      maxWidth: '640px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>📁 Drive Storage</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.85rem' }}>
            Folder ID: <code>{appFolderId}</code>
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Sign out
        </button>
      </div>

      {/* Image upload */}
      <Card title="1. Image Upload">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={imageStatus.type === 'loading'}
        />
        {imageStatus.message && <StatusBanner status={imageStatus} />}
      </Card>

      {/* JSON data */}
      <Card title="2. JSON Data">
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton onClick={handleJsonSave} disabled={jsonStatus.type === 'loading'} label="Save JSON" />
          <ActionButton onClick={handleJsonLoad} disabled={jsonStatus.type === 'loading'} label="Load JSON" />
        </div>
        {jsonStatus.message && <StatusBanner status={jsonStatus} />}
      </Card>
    </div>
  );
}

// ── Small helper components ────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '10px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1rem',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

function ActionButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: disabled ? '#ccc' : '#1a73e8',
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}
    >
      {label}
    </button>
  );
}

function StatusBanner({ status }: { status: Status }) {
  const colors = {
    loading: { bg: '#e8f0fe', text: '#1a73e8' },
    success: { bg: '#e6f4ea', text: '#137333' },
    error: { bg: '#fdecea', text: '#d32f2f' },
    idle: { bg: '#f5f5f5', text: '#555' },
  };
  const { bg, text } = colors[status.type];
  return (
    <div style={{
      marginTop: '10px',
      background: bg,
      color: text,
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '0.82rem',
      wordBreak: 'break-all',
      whiteSpace: 'pre-wrap',
    }}>
      {status.message}
    </div>
  );
}
