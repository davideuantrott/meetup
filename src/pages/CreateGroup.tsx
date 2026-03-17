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
    if (!name.trim()) {
      setError('Give the group a name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const group = await createGroup(name.trim(), profile.id);
      if (group) {
        navigate('/');
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Create your group</h1>
          <p className="text-gray-500 text-sm">
            You're the first one here. Give it a name.
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} size="lg" className="w-full">
              Create group
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
