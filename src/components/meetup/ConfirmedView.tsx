import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { Meetup, GroupMember, User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { formatCountdown, formatSlotTime } from '../../utils/slots';
import { getConfirmedCommentary } from '../../utils/commentary';

interface ConfirmedViewProps {
  meetup: Meetup;
  members: GroupMember[];
  currentUser?: User;
  isCreator: boolean;
  onCancel: () => void;
  onShare: () => void;
  children?: ReactNode;
}

export function ConfirmedView({ meetup, members, isCreator, onCancel, onShare, children }: ConfirmedViewProps) {
  const navigate = useNavigate();
  const confirmed = meetup.confirmed_details;
  const slot = confirmed?.slot;

  if (!confirmed || !slot) return null;

  const attendees = (slot.responses ?? [])
    .filter(r => r.availability === 'yes' && r.user)
    .map(r => r.user!);

  const oddOnesOut = members.filter(m => {
    if (!m.user) return false;
    const response = (slot.responses ?? []).find(r => r.user_id === m.user_id);
    return response?.availability === 'no' || !response;
  });

  const timeLabel = formatSlotTime(slot);
  const dateLabel = format(parseISO(slot.date), 'EEEE d MMMM');
  const commentary = getConfirmedCommentary(dateLabel, meetup.location);
  const countdown = formatCountdown(slot.date, slot.time_type === 'specific' ? slot.time_value : null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back to home"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-gray-900 flex-1 truncate">{meetup.title}</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Confirmed card */}
        <div className="bg-green-50 border border-green-300 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">Confirmed</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{dateLabel}</p>
            {timeLabel && <p className="text-lg text-gray-600 capitalize">{timeLabel}</p>}
            {meetup.location && (
              <p className="text-base text-gray-500 mt-1">{meetup.location}</p>
            )}
          </div>
          <p className="text-sm font-medium text-green-700">{countdown}</p>
          <p className="text-sm text-gray-500 italic">{commentary}</p>
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <section aria-labelledby="attendees-heading">
            <h2 id="attendees-heading" className="font-semibold text-gray-700 mb-3">Coming</h2>
            <div className="flex gap-3 flex-wrap">
              {attendees.map(u => (
                <div key={u.id} className="flex flex-col items-center gap-1">
                  <Avatar
                    user={u}
                    availability="yes"
                    size="md"
                    isOddOneOut={false}
                  />
                  <span className="text-xs text-gray-500">{u.name.split(' ')[0]}</span>
                </div>
              ))}
              {oddOnesOut.map(m => m.user && (
                <div key={m.user_id} className="flex flex-col items-center gap-1">
                  <Avatar
                    user={m.user}
                    availability="no"
                    size="md"
                    isOddOneOut
                  />
                  <span className="text-xs text-gray-400">{m.user.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onShare} className="flex-1">
            Share
          </Button>
          {isCreator && (
            <Button variant="danger" size="md" onClick={onCancel} className="flex-1">
              Cancel meetup
            </Button>
          )}
        </div>
      </main>

      {children}
    </div>
  );
}
