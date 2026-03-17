import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import type { Meetup, GroupMember } from '../../types';

interface MeetupCardProps {
  meetup: Meetup;
  members: GroupMember[];
  currentUserId: string;
}

export function MeetupCard({ meetup, members, currentUserId }: MeetupCardProps) {
  const navigate = useNavigate();
  const slots = meetup.slots ?? [];
  const totalResponders = new Set(slots.flatMap(s => (s.responses ?? []).map(r => r.user_id))).size;
  const memberCount = members.length;
  const isConfirmed = meetup.status === 'confirmed';
  const isArchived = meetup.status === 'archived' || meetup.status === 'cancelled';
  const confirmedSlot = meetup.confirmed_details?.slot;

  const myResponseCount = slots.filter(s =>
    (s.responses ?? []).some(r => r.user_id === currentUserId)
  ).length;
  const hasResponded = myResponseCount > 0;
  const needsResponse = !hasResponded && !isArchived && meetup.status === 'open';

  const cardStyle = isConfirmed
    ? 'bg-[#EBF0E6] shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-[20px]'
    : isArchived
    ? 'bg-[#F5F7F2] opacity-60 shadow-none rounded-2xl'
    : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-2xl';

  return (
    <div
      className={`p-4 cursor-pointer transition-shadow duration-[200ms] ${cardStyle}`}
      onClick={() => navigate(`/meetup/${meetup.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/meetup/${meetup.id}`)}
      aria-label={`${meetup.title} — ${meetup.status}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-[1rem] leading-snug text-[#1A1A1A]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            {meetup.title}
          </h3>
          <StatusChip status={meetup.status} />
        </div>

        {meetup.location && (
          <div className="flex items-center gap-1 text-[#6B6B6B]">
            <MapPin size={12} strokeWidth={1.75} />
            <span className="text-[0.8125rem]">{meetup.location}</span>
          </div>
        )}

        {isConfirmed && confirmedSlot ? (
          <div className="mt-1 flex items-center gap-3">
            <div
              className="bg-[#C8F542] rounded-full px-3 py-1 text-[0.8125rem] font-semibold text-[#1A1A1A] inline-flex items-center gap-1.5"
            >
              <Clock size={12} strokeWidth={1.75} />
              {format(parseISO(confirmedSlot.date), 'EEE d MMM')}
              {confirmedSlot.time_value && ` · ${confirmedSlot.time_value}`}
            </div>
            <span className="text-[0.75rem] text-[#6B6B6B]">
              {countdownLabel(confirmedSlot.date)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              {/* Progress dots */}
              <div className="flex gap-1">
                {Array.from({ length: memberCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < totalResponders ? 'bg-[#5C8348]' : 'bg-[#D0D0D0]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[0.75rem] text-[#6B6B6B]">
                {totalResponders === 0
                  ? 'No responses yet'
                  : `${totalResponders} of ${memberCount}`}
              </span>
            </div>
            {needsResponse && (
              <span className="text-[0.75rem] font-semibold text-[#5C8348] bg-[#F2F5EE] px-2.5 py-1 rounded-full">
                Your turn
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Meetup['status'] }) {
  const config = {
    open: { label: 'Open', bg: 'bg-[#F2F5EE]', text: 'text-[#5C8348]' },
    confirmed: { label: 'Confirmed', bg: 'bg-[#C8F542]', text: 'text-[#1A1A1A]' },
    cancelled: { label: 'Cancelled', bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]' },
    archived: { label: 'Archived', bg: 'bg-[#F5F5F5]', text: 'text-[#9E9E9E]' },
  }[status];

  return (
    <span
      className={`text-[0.75rem] font-semibold px-2.5 py-1 rounded-full shrink-0 ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function countdownLabel(date: string): string {
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days away`;
}
