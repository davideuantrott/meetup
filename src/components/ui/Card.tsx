import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  highlighted?: boolean;
  muted?: boolean;
  featured?: boolean;
}

export function Card({ children, highlighted, muted, featured, className = '', ...rest }: CardProps) {
  const base = 'rounded-2xl p-4 transition-shadow duration-[200ms]';

  const variant = featured
    ? 'bg-[#EBF0E6] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
    : highlighted
    ? 'bg-[#F2F5EE] border border-[#5C8348]/30 shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
    : muted
    ? 'bg-[#F5F7F2] opacity-60 shadow-none'
    : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]';

  return (
    <div className={`${base} ${variant} ${className}`} {...rest}>
      {children}
    </div>
  );
}
