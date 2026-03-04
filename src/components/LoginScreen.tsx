/**
 * LoginScreen.tsx
 *
 * Sign-in screen shown when the user is not authenticated.
 * Styled to match the dark design system.
 */

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function LoginScreen({ onLogin, isLoading, error }: LoginScreenProps) {
  return (
    <div className="login-screen">
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 3rem',
        boxShadow: 'var(--shadow-modal)',
        textAlign: 'center',
        maxWidth: '380px',
        width: '100%',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.4))' }}>✦</div>

        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SortsTG
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
          Sign in with Google to access your contacts stored in Drive.
        </p>

        <button
          onClick={onLogin}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            width: '100%',
            padding: '12px 20px',
            background: isLoading
              ? 'var(--bg-elevated)'
              : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: isLoading ? 'none' : '0 4px 20px var(--accent-glow)',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          {isLoading ? '⏳ Connecting…' : '🔐 Sign in with Google'}
        </button>

        {error && (
          <p style={{
            marginTop: '1rem',
            color: 'var(--red)',
            fontSize: '0.82rem',
            background: 'var(--red-bg)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
