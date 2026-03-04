/**
 * Spinner.tsx — animated loading ring.
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return <span className={`spinner spinner--${size}`} aria-label="Loading…" />;
}
