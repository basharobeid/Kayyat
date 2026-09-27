import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-body-s font-medium text-charcoal">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 px-3.5 py-2 text-body-m bg-surface border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold ${
            error ? 'border-danger focus:ring-danger' : 'border-line'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-caption text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-caption text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
