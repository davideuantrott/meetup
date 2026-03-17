import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (!session) {
    const params = new URLSearchParams();
    params.set('redirect', location.pathname + location.search);
    return <Navigate to={`/signin?${params}`} replace />;
  }

  return <>{children}</>;
}
