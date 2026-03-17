import type { ReactNode } from 'react';
import { AuthContext, useAuthState } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  usePushNotifications(auth.profile?.id);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
