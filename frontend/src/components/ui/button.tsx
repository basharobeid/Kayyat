import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  // Dark text on gold: white on #C9A227 is only 2.4:1, ink is 5.9:1.
  primary: 'bg-gold text-ink hover:bg-gold/90 shadow-sm',
  secondary: 'border border-ink/20 bg-surface text-ink hover:border-ink/40 hover:bg-mist/60',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-success text-white hover:bg-success/90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-body-s',
  md: 'h-11 px-5 text-body-m', // 44px: comfortable touch target
  lg: 'h-12 px-7 text-body-l',
};

/** Shared so links can look like buttons: <Link className={buttonStyles()}> */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={buttonStyles({ variant, size, className })} {...props} />
  ),
);
Button.displayName = 'Button';
