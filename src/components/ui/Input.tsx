import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({ label, error, helpText, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[0.8125rem] font-medium text-[#1A1A1A]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`
          w-full rounded-xl px-4 text-[1rem] min-h-[48px]
          bg-[#FAFBF8] placeholder:text-[#9E9E9E]
          transition-all duration-[200ms]
          focus:outline-none focus:ring-0
          disabled:bg-[#F5F7F2] disabled:text-[#9E9E9E]
          ${error
            ? 'border border-[#F44336] bg-[#FFEBEE]'
            : 'border border-[#D0D0D0] focus:border-[#5C8348] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]'}
          ${className}
        `}
        style={{ fontFamily: 'var(--font-body)' }}
        {...rest}
      />
      {helpText && !error && (
        <p id={helpId} className="text-[0.75rem] text-[#6B6B6B]" style={{ fontFamily: 'var(--font-body)' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[0.75rem] text-[#F44336]" role="alert" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
