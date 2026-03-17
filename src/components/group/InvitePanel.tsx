import { useState } from 'react';
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const el = document.createElement('input');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await onInviteByEmail(email.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
      setEmail('');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-gray-800">Shareable link</h3>
        <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg px-3 py-2 break-all">
          {inviteLink}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink} className="flex-1">
            {copied ? 'Copied.' : 'Copy link'}
          </Button>
          {typeof navigator.share !== 'undefined' && (
            <Button variant="secondary" size="sm" onClick={handleShareLink} className="flex-1">
              Share
            </Button>
          )}
        </div>
      </section>

      <hr className="border-gray-200" />

      <section className="flex flex-col gap-3">
        <h3 className="font-medium text-gray-800">Invite by email</h3>
        <form onSubmit={handleSendEmail} className="flex flex-col gap-3">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="friend@example.com"
            label="Email address"
          />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          {sent && <p className="text-sm text-green-600" role="status">Invite sent.</p>}
          <Button type="submit" loading={loading} size="md">
            Send invite
          </Button>
        </form>
      </section>

      <Button variant="ghost" size="sm" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
