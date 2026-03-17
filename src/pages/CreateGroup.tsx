import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function CreateGroup() {
  const { profile } = useAuth();
  const { createGroup } = useGroup(profile?.id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim()) { setError('Give the group a name.'); return; }
    setLoading(true);
    setError(null);
    try {
      const group = await createGroup(name.trim(), profile.id);
      if (group) navigate('/');
      else setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg, #F2F5EE 0%, #EBF0E6 50%, #F5F7F2 100%)' }}
    >
      <div className="w-full max-w-[380px] flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1
            className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-[#1A1A1A]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
          >
            Create your group
          </h1>
          <p className="text-[0.875rem] text-[#6B6B6B]" style={{ fontFamily: 'var(--font-body)' }}>
            You're the first one here. Give it a name.
          </p>
        </header>

        <div
          className="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] p-6"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Group name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Swimming Pals"
              autoFocus
              required
            />
            {error && (
              <p className="text-[0.8125rem] text-[#F44336]" role="alert">{error}</p>
            )}
            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              Create group
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
