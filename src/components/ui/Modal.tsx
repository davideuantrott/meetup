import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

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
    if (open) {
      d.showModal();
    } else {
      d.close();
    }
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
      className="rounded-2xl p-0 w-full max-w-md mx-auto shadow-xl backdrop:bg-black/40 open:animate-in open:fade-in open:duration-150"
      aria-labelledby="modal-title"
    >
      <div className="p-6 flex flex-col gap-4">
        <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <div>{children}</div>
        {actions && <div className="flex gap-2 justify-end">{actions}</div>}
        {!actions && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
