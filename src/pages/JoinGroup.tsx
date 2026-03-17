import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { Button } from '../components/ui/Button';

export function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { profile } = useAuth();
  const { joinGroupByCode } = useGroup(profile?.id);
  const navigate = useNavigate();
  const [status, setStatus] = useState<'joining' | 'error'>('joining');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!profile || !inviteCode) return;
    joinGroupByCode(inviteCode, profile.id).then(({ error }) => {
      if (error) { setStatus('error'); setErrorMsg(error); }
      else navigate('/');
    });
  }, [profile, inviteCode]);

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center p-5 bg-[#F5F7F2]">
        <div className="text-center flex flex-col gap-3">
          <p
            className="text-[1.125rem] font-semibold text-[#1A1A1A]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Something went wrong.
          </p>
          <p className="text-[0.875rem] text-[#6B6B6B]">{errorMsg}</p>
          <Button variant="ghost" onClick={() => navigate('/')}>Go home</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7F2]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#C8F542] animate-pulse" />
        <p className="text-[0.875rem] text-[#6B6B6B]">Joining group…</p>
      </div>
    </main>
  );
}
