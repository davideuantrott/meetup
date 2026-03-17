import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  highlighted?: boolean;
  muted?: boolean;
}

export function Card({ children, highlighted, muted, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border p-4
        ${highlighted ? 'border-indigo-400 bg-indigo-50 shadow-md' : muted ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white shadow-sm'}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
