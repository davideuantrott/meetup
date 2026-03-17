import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { RequireAuth } from './components/RequireAuth';
import { RequireGroup } from './components/RequireGroup';
import { InstallPrompt } from './components/notifications/InstallPrompt';
import { SignIn } from './pages/SignIn';
import { AuthCallback } from './pages/AuthCallback';
import { CreateGroup } from './pages/CreateGroup';
import { JoinGroup } from './pages/JoinGroup';
import { Home } from './pages/Home';
import { CreateMeetup } from './pages/CreateMeetup';
import { MeetupView } from './pages/MeetupView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Invite link — requires auth, then joins group */}
          <Route
            path="/join/:inviteCode"
            element={
              <RequireAuth>
                <JoinGroup />
              </RequireAuth>
            }
          />

          {/* Group creation — requires auth but no group yet */}
          <Route
            path="/create-group"
            element={
              <RequireAuth>
                <CreateGroup />
              </RequireAuth>
            }
          />

          {/* App routes — require auth + group */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireGroup>
                  <Home />
                </RequireGroup>
              </RequireAuth>
            }
          />
          <Route
            path="/create-meetup"
            element={
              <RequireAuth>
                <RequireGroup>
                  <CreateMeetup />
                </RequireGroup>
              </RequireAuth>
            }
          />
          <Route
            path="/meetup/:id"
            element={
              <RequireAuth>
                <RequireGroup>
                  <MeetupView />
                </RequireGroup>
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <InstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}
