import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';

export function RequireGroup({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { group, loading } = useGroup(profile?.id);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (!group) {
    return <Navigate to="/create-group" replace />;
  }

  return <>{children}</>;
}
