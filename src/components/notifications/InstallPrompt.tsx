import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('installPromptDismissed')) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('installPromptDismissed', '1');
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-0 right-0 flex justify-center px-5 z-50"
    >
      <div
        className="bg-[#1A1A1A] text-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-[400px] w-full"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="w-1 self-stretch rounded-full bg-[#C8F542] shrink-0" aria-hidden="true" />
        <p className="text-[0.875rem] flex-1">Install this. Push notifications are worth it.</p>
        <button
          onClick={install}
          className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#C8F542] hover:text-[#E8FAAB] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F542] rounded"
        >
          <Download size={14} strokeWidth={2} />
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="text-[#6B6B6B] hover:text-[#9E9E9E] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B6B6B] rounded"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
