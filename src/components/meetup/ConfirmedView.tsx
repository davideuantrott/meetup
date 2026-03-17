import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Share2, XCircle, MapPin } from 'lucide-react';
import type { Meetup, GroupMember } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { formatCountdown, formatSlotTime } from '../../utils/slots';
import { getConfirmedCommentary } from '../../utils/commentary';

interface ConfirmedViewProps {
  meetup: Meetup;
  members: GroupMember[];
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
    const r = (slot.responses ?? []).find(r => r.user_id === m.user_id);
    return r?.availability === 'no' || !r;
  });

  const timeLabel = formatSlotTime(slot);
  const dateLabel = format(parseISO(slot.date), 'EEEE d MMMM');
  const countdown = formatCountdown(slot.date, slot.time_type === 'specific' ? slot.time_value : null);
  const commentary = getConfirmedCommentary(dateLabel, meetup.location);

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header className="bg-[#F5F7F2] sticky top-0 z-10 pt-4 pb-2 px-5">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F7F2] text-[#6B6B6B] hover:bg-[#EBF0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] shrink-0"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <h1
            className="text-[1.25rem] font-bold text-[#1A1A1A] flex-1 truncate tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {meetup.title}
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-[480px] mx-auto w-full px-5 py-4 flex flex-col gap-5 pb-10">

        {/* Confirmed hero card */}
        <div className="bg-[#EBF0E6] rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-6 flex flex-col gap-4">
          {/* Status chip */}
          <div className="flex items-center gap-2">
            <span className="bg-[#C8F542] text-[#1A1A1A] text-[0.6875rem] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Confirmed
            </span>
          </div>

          {/* Date display — uses the bold/light contrast from the type spec */}
          <div className="flex flex-col gap-1">
            <p
              className="text-[2rem] leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
            >
              {dateLabel}
            </p>
            {timeLabel && (
              <p
                className="text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-[#6B6B6B] capitalize"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}
              >
                {timeLabel}
              </p>
            )}
            {meetup.location && (
              <div className="flex items-center gap-1.5 mt-1 text-[#476834]">
                <MapPin size={14} strokeWidth={1.75} />
                <span className="text-[0.875rem]">{meetup.location}</span>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4CAF50]" aria-hidden="true" />
            <span className="text-[0.875rem] font-semibold text-[#5C8348]">{countdown}</span>
          </div>

          {/* Commentary */}
          <p className="text-[0.875rem] text-[#6B6B6B] italic">{commentary}</p>
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <section aria-labelledby="attendees-heading">
            <h2
              id="attendees-heading"
              className="text-[0.8125rem] font-medium text-[#9E9E9E] uppercase tracking-wider mb-3"
            >
              Coming
            </h2>
            <div className="flex gap-4 flex-wrap">
              {attendees.map(u => (
                <div key={u.id} className="flex flex-col items-center gap-1">
                  <Avatar user={u} availability="yes" size="md" />
                  <span className="text-[0.625rem] text-[#6B6B6B] font-medium">{u.name.split(' ')[0]}</span>
                </div>
              ))}
              {oddOnesOut.map(m => m.user && (
                <div key={m.user_id} className="flex flex-col items-center gap-1">
                  <Avatar user={m.user} availability="no" size="md" isOddOneOut />
                  <span className="text-[0.625rem] text-[#9E9E9E]">{m.user.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onShare} className="flex-1">
            <Share2 size={16} strokeWidth={1.75} />
            Share
          </Button>
          {isCreator && (
            <Button variant="danger" size="md" onClick={onCancel} className="flex-1">
              <XCircle size={16} strokeWidth={1.75} />
              Cancel
            </Button>
          )}
        </div>
      </main>

      {children}
    </div>
  );
}
