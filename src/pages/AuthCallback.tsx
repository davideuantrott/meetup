import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleUser(user: import('@supabase/supabase-js').User) {
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

    // Wait for Supabase to process the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        subscription.unsubscribe();
        handleUser(session.user);
      } else if (event === 'INITIAL_SESSION' && !session) {
        subscription.unsubscribe();
        navigate('/signin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in…</p>
    </main>
  );
}
