import React from 'react';

export interface BadgeProps {
  variant?: 'gold' | 'ink' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gold',
  children,
  className = '',
}) => {
  const styles = {
    gold: 'bg-gold/15 text-gold-ink border-gold/30',
    ink: 'bg-ink/10 text-ink border-ink/20',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    info: 'bg-info/15 text-info border-info/30',
    muted: 'bg-muted/15 text-muted border-muted/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption border font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
