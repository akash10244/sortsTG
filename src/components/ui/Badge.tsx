/**
 * Badge.tsx — small label pill.
 */
interface BadgeProps {
  label: string;
  variant?: 'active' | 'inactive' | 'budget' | 'midrange' | 'premium' | 'models' | 'default';
  className?: string;
}

export function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {label}
    </span>
  );
}
