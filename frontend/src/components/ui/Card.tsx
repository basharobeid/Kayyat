import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  id,
}) => {
  const hoverClass = hoverable
    ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'
    : '';

  return (
    <div
      id={id}
      className={`bg-surface border border-line/60 rounded-lg p-5 shadow-sm ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};
