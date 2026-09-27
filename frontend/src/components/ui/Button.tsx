import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gold text-ink hover:bg-gold-ink hover:text-surface shadow-sm focus:ring-gold',
    secondary: 'bg-ink text-cream hover:bg-charcoal shadow-sm focus:ring-ink',
    outline: 'border border-line text-charcoal bg-surface hover:bg-mist focus:ring-gold',
    ghost: 'text-charcoal hover:bg-mist hover:text-ink focus:ring-ink',
    danger: 'bg-danger text-surface hover:bg-red-700 shadow-sm focus:ring-danger',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-body-s',
    md: 'px-4 py-2.5 text-body-m',
    lg: 'px-6 py-3.5 text-body-l font-semibold',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
