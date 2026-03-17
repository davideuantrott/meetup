import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type Mode = 'signin' | 'signup';

export function SignIn() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteCode) sessionStorage.setItem('pendingInviteCode', inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  async function handleGoogle() {
    await signInWithGoogle();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); return; }
        const { error } = await signUpWithEmail(email, password, name);
        if (error) setError(error.message);
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setError(error.message.includes('Invalid login')
            ? 'Incorrect email or password. Try again, or create an account.'
            : error.message);
        }
      }
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

        {/* Brand */}
        <header className="text-center flex flex-col gap-3">
          {/* Logo mark */}
          <div className="mx-auto w-16 h-16 rounded-full bg-[#C8F542] flex items-center justify-center shadow-[0_4px_20px_rgba(200,245,66,0.4)]">
            <span className="text-3xl" aria-hidden="true">🏊</span>
          </div>
          <div>
            <h1
              className="text-[2rem] leading-[1.15] tracking-[-0.02em] text-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              Swimming Pals
            </h1>
            <p
              className="text-[1.25rem] leading-[1.2] tracking-[-0.01em] text-[#6B6B6B]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}
            >
              {inviteCode ? "You've been invited." : 'Planner'}
            </p>
          </div>
          <p className="text-[0.875rem] text-[#6B6B6B]" style={{ fontFamily: 'var(--font-body)' }}>
            {inviteCode
              ? 'Sign in to join the group.'
              : 'Scheduling meetups for people who find it very hard.'}
          </p>
        </header>

        {/* Card */}
        <div
          className="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-5"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {/* Google */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleGoogle}
            className="w-full"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-[#E0E0E0]" />
            <span className="text-[0.75rem] text-[#9E9E9E] uppercase tracking-wider">or</span>
            <hr className="flex-1 border-[#E0E0E0]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                placeholder="What do people call you"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              required
            />
            {error && (
              <p className="text-[0.8125rem] text-[#F44336]" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-[0.875rem] text-center text-[#5C8348] hover:text-[#476834] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] rounded-lg py-1 transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Create one."
              : 'Already have an account? Sign in.'}
          </button>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.5 2.9 13.5l7.9 6.1C12.6 13.2 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.5-.1-3-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.2 7-17.1z"/>
      <path fill="#FBBC05" d="M10.8 28.4c-.6-1.6-.9-3.3-.9-5s.3-3.4.9-5L2.9 12.3C1 16.1 0 20.4 0 24s1 7.9 2.9 11.7l7.9-7.3z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.1-5.5l-7.6-5.9c-2.1 1.4-4.7 2.2-7.5 2.2-6.2 0-11.4-4-13.2-9.4l-7.9 7.3C6.6 42.5 14.6 48 24 48z"/>
    </svg>
  );
}
