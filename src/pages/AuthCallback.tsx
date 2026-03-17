import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/signin');
        return;
      }

      const user = session.user;

      // Ensure profile row exists (for Google OAuth users)
      const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).single();
      if (!existing) {
        const { AVATAR_COLOURS: colours } = await import('../types');
        const colour = colours[Math.floor(Math.random() * colours.length)];
        await supabase.from('users').insert({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Friend',
          email: user.email!,
          avatar_colour: colour,
        });
      }

      // Handle pending invite
      const pendingInvite = sessionStorage.getItem('pendingInviteCode');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInviteCode');
        navigate(`/join/${pendingInvite}`);
        return;
      }

      navigate('/');
    }

    handleCallback();
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in…</p>
    </main>
  );
}
