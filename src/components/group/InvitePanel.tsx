import { useState } from 'react';
import { Copy, Share2, Send, Check } from 'lucide-react';
import type { Group } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface InvitePanelProps {
  group: Group;
  onInviteByEmail: (email: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export function InvitePanel({ group, onInviteByEmail, onClose }: InvitePanelProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${group.invite_code}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const el = document.createElement('input');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareLink() {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${group.name}`,
        text: `You're invited to join ${group.name} on Swimming Pals Planner.`,
        url: inviteLink,
      });
    } else {
      handleCopyLink();
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Enter an email address.'); return; }
    setLoading(true);
    setError(null);
    const result = await onInviteByEmail(email.trim());
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSent(true); setEmail(''); }
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Shareable link */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[0.8125rem] font-medium text-[#6B6B6B] uppercase tracking-wider">
          Shareable link
        </h3>
        <div className="bg-[#F5F7F2] rounded-xl px-4 py-3">
          <p className="text-[0.8125rem] text-[#6B6B6B] font-mono break-all leading-relaxed">
            {inviteLink}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink} className="flex-1">
            {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.75} />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          {typeof navigator.share !== 'undefined' && (
            <Button variant="secondary" size="sm" onClick={handleShareLink} className="flex-1">
              <Share2 size={14} strokeWidth={1.75} />
              Share
            </Button>
          )}
        </div>
      </section>

      <hr className="border-[#E0E0E0]" />

      {/* Email invite */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[0.8125rem] font-medium text-[#6B6B6B] uppercase tracking-wider">
          Invite by email
        </h3>
        <form onSubmit={handleSendEmail} className="flex flex-col gap-3">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="friend@example.com"
            label="Email address"
          />
          {error && <p className="text-[0.8125rem] text-[#F44336]" role="alert">{error}</p>}
          {sent && (
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#5C8348]">
              <Check size={14} strokeWidth={2} />
              Invite sent.
            </div>
          )}
          <Button type="submit" loading={loading} size="md">
            <Send size={14} strokeWidth={1.75} />
            Send invite
          </Button>
        </form>
      </section>

      <Button variant="ghost" size="sm" onClick={onClose} className="self-center">
        Done
      </Button>
    </div>
  );
}
