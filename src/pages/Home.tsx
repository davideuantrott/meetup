import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useMeetups } from '../hooks/useMeetups';
import { Button } from '../components/ui/Button';
import { MeetupCard } from '../components/meetup/MeetupCard';
import { InvitePanel } from '../components/group/InvitePanel';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';

export function Home() {
  const { profile, signOut } = useAuth();
  const { group, members, inviteByEmail, updateGroupName } = useGroup(profile?.id);
  const { activeMeetups, archivedMeetups, loading } = useMeetups(group?.id);
  const navigate = useNavigate();

  const [showInvite, setShowInvite] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  async function handleInviteByEmail(email: string) {
    if (!group) return { error: 'No group.' };
    return inviteByEmail(email, group.id, group.invite_code, group.name);
  }

  async function handleSaveSettings() {
    if (!group || !groupName.trim()) return;
    setSavingName(true);
    await updateGroupName(group.id, groupName.trim());
    // Save group image if changed
    if (groupImage !== (group.image_url ?? null)) {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('groups').update({ image_url: groupImage }).eq('id', group.id);
    }
    setSavingName(false);
    setShowSettings(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7F2]">
        <div className="w-10 h-10 rounded-full bg-[#C8F542] animate-pulse" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header className="bg-[#F5F7F2] sticky top-0 z-10 pt-4 pb-2 px-5">
        <div className="max-w-screen-lg mx-auto flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Group image if available */}
            {group?.image_url && (
              <img
                src={group.image_url}
                alt={group.name}
                className="w-12 h-12 rounded-full object-cover shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              />
            )}
            <div className="min-w-0">
              <h1
                className="text-[2rem] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A] truncate"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                {group?.name ?? 'Swimming Pals'}
              </h1>
              <p
                className="text-[1.25rem] leading-[1.2] tracking-[-0.01em] text-[#6B6B6B] mt-0.5"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}
              >
                {activeMeetups.length === 0
                  ? 'Nothing on yet'
                  : `${activeMeetups.length} active ${activeMeetups.length === 1 ? 'meetup' : 'meetups'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <IconButton onClick={() => setShowInvite(true)} label="Invite members">
              <UserPlus size={20} strokeWidth={1.75} />
            </IconButton>
            <IconButton
              onClick={() => { setGroupName(group?.name ?? ''); setGroupImage(group?.image_url ?? null); setShowSettings(true); }}
              label="Settings"
            >
              {profile ? <Avatar user={profile} size="sm" /> : <Settings size={20} strokeWidth={1.75} />}
            </IconButton>
          </div>
        </div>
      </header>

      {/* Member strip */}
      {members.length > 0 && (
        <div className="px-5 py-3">
          <div className="max-w-screen-lg mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
            {members.map(m => m.user && (
              <div key={m.user_id} className="flex flex-col items-center gap-1 shrink-0">
                <Avatar user={m.user} size="sm" />
                <span className="text-[0.625rem] text-[#9E9E9E] font-medium max-w-[40px] truncate text-center">
                  {m.user.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 px-5 pb-8">
        <div className="max-w-screen-lg mx-auto flex flex-col gap-6">

          {/* Active meetups */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-[0.8125rem] font-medium text-[#9E9E9E] uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Active
              </h2>
              <button
                onClick={() => navigate('/create-meetup')}
                className="
                  w-9 h-9 rounded-full bg-[#C8F542] flex items-center justify-center
                  shadow-[0_4px_20px_rgba(200,245,66,0.35)]
                  hover:bg-[#B8E035] transition-colors btn-press
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
                "
                aria-label="Create new meetup"
              >
                <Plus size={18} strokeWidth={2.5} color="#1A1A1A" />
              </button>
            </div>

            {activeMeetups.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 text-center flex flex-col gap-4">
                <p className="text-[0.875rem] text-[#6B6B6B]">
                  Nothing on the calendar. Someone has to start somewhere.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => navigate('/create-meetup')}>
                    Create a meetup
                  </Button>
                </div>
              </div>
            ) : (
              <ul
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
              >
                {activeMeetups.map(m => (
                  <li key={m.id}>
                    {profile && (
                      <MeetupCard meetup={m} members={members} currentUserId={profile.id} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Archived */}
          {archivedMeetups.length > 0 && (
            <section>
              <button
                onClick={() => setShowArchived(v => !v)}
                className="flex items-center gap-1.5 text-[0.8125rem] text-[#9E9E9E] hover:text-[#6B6B6B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] rounded-lg"
                aria-expanded={showArchived}
              >
                <ChevronDown
                  size={14}
                  strokeWidth={1.75}
                  className={`transition-transform duration-[200ms] ${showArchived ? 'rotate-180' : ''}`}
                />
                Archive ({archivedMeetups.length})
              </button>

              {showArchived && (
                <ul className="grid gap-2 mt-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
                  {archivedMeetups.map(m => (
                    <li key={m.id}>
                      {profile && (
                        <MeetupCard meetup={m} members={members} currentUserId={profile.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
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
            <Button size="sm" loading={savingName} onClick={handleSaveSettings}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Group name"
            id="group-name-input"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
          {profile && (
            <ImageUpload
              currentUrl={groupImage}
              userId={profile.id}
              onUploaded={setGroupImage}
              label="Group photo"
              shape="circle"
            />
          )}
          <hr className="border-[#E0E0E0]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-[#F44336] hover:bg-[#FFEBEE] w-full justify-center"
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function IconButton({ onClick, label, children }: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="
        w-11 h-11 flex items-center justify-center rounded-full
        bg-[#F5F7F2] text-[#6B6B6B]
        hover:bg-[#EBF0E6] hover:text-[#1A1A1A]
        transition-colors btn-press
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
      "
    >
      {children}
    </button>
  );
}
