import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, title, onClose, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) d.showModal();
    else d.close();
  }, [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const handleClose = () => onClose();
    d.addEventListener('close', handleClose);
    return () => d.removeEventListener('close', handleClose);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="
        rounded-[28px] p-0 w-full max-w-[420px] mx-auto
        shadow-[0_16px_48px_rgba(0,0,0,0.14)]
        bg-white
      "
      aria-labelledby="modal-title"
    >
      <div className="p-6 flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h2
            id="modal-title"
            className="text-[1.125rem] font-semibold text-[#1A1A1A] leading-snug"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="
              w-8 h-8 flex items-center justify-center rounded-full
              text-[#6B6B6B] hover:bg-[#F5F7F2] hover:text-[#1A1A1A]
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
            "
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-2 justify-end pt-1">{actions}</div>
        )}
      </div>
    </dialog>
  );
}
