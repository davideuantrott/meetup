import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useMeetups } from '../hooks/useMeetups';
import { Button } from '../components/ui/Button';
import { MeetupCard } from '../components/meetup/MeetupCard';
import { InvitePanel } from '../components/group/InvitePanel';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

export function Home() {
  const { profile, signOut } = useAuth();
  const { group, members, inviteByEmail, updateGroupName } = useGroup(profile?.id);
  const { activeMeetups, archivedMeetups, loading } = useMeetups(group?.id);
  const navigate = useNavigate();

  const [showInvite, setShowInvite] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [savingName, setSavingName] = useState(false);

  async function handleInviteByEmail(email: string) {
    if (!group) return { error: 'No group.' };
    return inviteByEmail(email, group.id, group.invite_code, group.name);
  }

  async function handleSaveGroupName() {
    if (!group || !groupName.trim()) return;
    setSavingName(true);
    await updateGroupName(group.id, groupName.trim());
    setSavingName(false);
    setShowSettings(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">
              {group?.name ?? 'Swimming Pals Planner'}
            </h1>
            <p className="text-xs text-gray-400">{members.length} members</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Invite members"
              onClick={() => setShowInvite(true)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Invite members"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            <button
              aria-label="Group settings"
              onClick={() => { setGroupName(group?.name ?? ''); setShowSettings(true); }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Group settings"
            >
              {profile && (
                <Avatar user={profile} size="sm" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Members row */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {members.map(m => m.user && (
            <div key={m.user_id} className="flex flex-col items-center gap-0.5 shrink-0">
              <Avatar user={m.user} size="sm" />
              <span className="text-xs text-gray-400 max-w-[40px] truncate">{m.user.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Active meetups */}
        <section aria-labelledby="active-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="active-heading" className="font-semibold text-gray-700">Active</h2>
            <Button size="sm" onClick={() => navigate('/create-meetup')}>
              + New meetup
            </Button>
          </div>

          {activeMeetups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">
                Nothing on the calendar. Someone has to start somewhere.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/create-meetup')}
              >
                Create a meetup
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" role="list">
              {activeMeetups.map(m => (
                <li key={m.id}>
                  {profile && (
                    <MeetupCard
                      meetup={m}
                      members={members}
                      currentUserId={profile.id}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Archived meetups */}
        {archivedMeetups.length > 0 && (
          <section aria-labelledby="archived-heading">
            <button
              id="archived-heading"
              onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              aria-expanded={showArchived}
            >
              <svg
                className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Archive ({archivedMeetups.length})
            </button>

            {showArchived && (
              <ul className="flex flex-col gap-2 mt-3" role="list">
                {archivedMeetups.map(m => (
                  <li key={m.id}>
                    {profile && (
                      <MeetupCard
                        meetup={m}
                        members={members}
                        currentUserId={profile.id}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {/* Invite modal */}
      <Modal open={showInvite} title="Invite members" onClose={() => setShowInvite(false)}>
        {group && (
          <InvitePanel
            group={group}
            onInviteByEmail={handleInviteByEmail}
            onClose={() => setShowInvite(false)}
          />
        )}
      </Modal>

      {/* Settings modal */}
      <Modal
        open={showSettings}
        title="Settings"
        onClose={() => setShowSettings(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button size="sm" loading={savingName} onClick={handleSaveGroupName}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-name-input" className="text-sm font-medium text-gray-700">Group name</label>
            <input
              id="group-name-input"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          </div>
          <hr className="border-gray-200" />
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-red-600 hover:bg-red-50"
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
