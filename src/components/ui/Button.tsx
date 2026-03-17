import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center gap-2 font-semibold
    transition-all btn-press select-none
    disabled:opacity-40 disabled:pointer-events-none
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  `;

  const variants = {
    primary: `
      bg-[#C8F542] text-[#1A1A1A] rounded-full
      hover:bg-[#B8E035]
      shadow-[0_4px_20px_rgba(200,245,66,0.35)]
      hover:shadow-[0_6px_24px_rgba(200,245,66,0.45)]
      focus-visible:ring-[#5C8348]
    `,
    secondary: `
      bg-transparent text-[#1A1A1A] rounded-full
      border border-[#D0D0D0]
      hover:bg-[#F5F7F2]
      focus-visible:ring-[#5C8348]
    `,
    danger: `
      bg-[#F44336] text-white rounded-full
      hover:bg-[#D32F2F]
      shadow-[0_2px_8px_rgba(244,67,54,0.25)]
      focus-visible:ring-[#F44336]
    `,
    ghost: `
      bg-transparent text-[#5C8348] rounded-xl
      hover:bg-[#F2F5EE]
      focus-visible:ring-[#5C8348]
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-[0.8125rem] min-h-[36px]',
    md: 'px-5 py-3 text-[0.9375rem] min-h-[44px]',
    lg: 'px-6 py-3.5 text-[0.9375rem] min-h-[52px]',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
