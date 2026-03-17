import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { Meetup, GroupMember } from '../../types';
import { Card } from '../ui/Card';
import {} from '../../utils/slots';

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
  const confirmedSlot = meetup.confirmed_details?.slot;

  const myResponseCount = slots.filter(s =>
    (s.responses ?? []).some(r => r.user_id === currentUserId)
  ).length;
  const hasResponded = myResponseCount > 0;

  return (
    <Card
      highlighted={isConfirmed}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/meetup/${meetup.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/meetup/${meetup.id}`)}
      aria-label={`${meetup.title} — ${meetup.status}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-tight">{meetup.title}</h3>
          <StatusBadge status={meetup.status} />
        </div>

        {meetup.location && (
          <p className="text-sm text-gray-500">{meetup.location}</p>
        )}

        {isConfirmed && confirmedSlot ? (
          <div className="mt-1">
            <p className="text-sm font-medium text-indigo-700">
              {format(parseISO(confirmedSlot.date), 'EEE d MMM')}
              {confirmedSlot.time_value && ` · ${confirmedSlot.time_value}`}
            </p>
            <p className="text-xs text-gray-400">
              {countdownLabel(confirmedSlot.date)}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500">
              {totalResponders === 0
                ? 'No responses yet.'
                : `${totalResponders} of ${memberCount} responded`}
            </p>
            {!hasResponded && (
              <span className="text-xs text-indigo-600 font-medium">Your turn</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Meetup['status'] }) {
  const config = {
    open: { label: 'Open', class: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
    archived: { label: 'Archived', class: 'bg-gray-100 text-gray-500' },
  }[status];

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${config.class}`}>
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
