import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';

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
      if (error) {
        setStatus('error');
        setErrorMsg(error);
      } else {
        navigate('/');
      }
    });
  }, [profile, inviteCode]);

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center flex flex-col gap-3">
          <p className="text-gray-700 font-medium">Something went wrong.</p>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
          <button
            className="text-indigo-600 underline text-sm"
            onClick={() => navigate('/')}
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-gray-500">Joining group…</p>
    </main>
  );
}
