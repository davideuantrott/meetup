import type { ProposedSlot, GroupMember, User } from '../../types';
import type { Availability } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatSlotDate, formatSlotTime, getYesCount, getMaybeCount, getNoCount, getUserResponse } from '../../utils/slots';

interface SlotCardProps {
  slot: ProposedSlot;
  members: GroupMember[];
  currentUser: User;
  isBest: boolean;
  onRespond: (availability: Availability) => void;
  disabled?: boolean;
}

export function SlotCard({ slot, members, currentUser, isBest, onRespond, disabled }: SlotCardProps) {
  const myResponse = getUserResponse(slot, currentUser.id);
  const currentAnswer = myResponse?.availability;

  const yesCount = getYesCount(slot);
  const maybeCount = getMaybeCount(slot);
  const noCount = getNoCount(slot);

  const timeLabel = formatSlotTime(slot);

  return (
    <article
      className={`
        flex-shrink-0 w-64 rounded-2xl border p-4 flex flex-col gap-4 snap-start
        ${isBest ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white shadow-sm'}
      `}
      aria-label={`${formatSlotDate(slot)}${timeLabel ? `, ${timeLabel}` : ''}`}
    >
      {/* Date header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-gray-900">{formatSlotDate(slot)}</p>
          {timeLabel && (
            <p className="text-sm text-gray-500 capitalize">{timeLabel}</p>
          )}
        </div>
        {isBest && (
          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium shrink-0">
            Best
          </span>
        )}
      </div>

      {/* Response avatars */}
      <div className="flex flex-col gap-2">
        {(['yes', 'maybe', 'no'] as Availability[]).map(avail => {
          const respondents = (slot.responses ?? [])
            .filter(r => r.availability === avail && r.user)
            .map(r => r.user!);

          if (respondents.length === 0) return null;

          const colourClass = avail === 'yes'
            ? 'text-green-700'
            : avail === 'maybe'
            ? 'text-amber-600'
            : 'text-red-600';

          const label = avail === 'yes' ? 'Yes' : avail === 'maybe' ? 'Maybe' : 'No';

          return (
            <div key={avail} className="flex items-center gap-2">
              <span className={`text-xs font-semibold w-10 shrink-0 ${colourClass}`}>{label}</span>
              <div className="flex gap-1 flex-wrap">
                {respondents.map(u => (
                  <Avatar key={u.id} user={u} availability={avail} size="sm" />
                ))}
              </div>
            </div>
          );
        })}

        {/* Non-responders */}
        {(() => {
          const respondedIds = new Set((slot.responses ?? []).map(r => r.user_id));
          const nonResponders = members
            .filter(m => !respondedIds.has(m.user_id) && m.user)
            .map(m => m.user!);
          if (nonResponders.length === 0) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold w-10 shrink-0 text-gray-400">—</span>
              <div className="flex gap-1 flex-wrap">
                {nonResponders.map(u => (
                  <Avatar key={u.id} user={u} hasNotResponded size="sm" />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Response buttons */}
      <div className="flex gap-2 mt-auto" role="group" aria-label="Your response">
        {(['yes', 'maybe', 'no'] as Availability[]).map(avail => {
          const isActive = currentAnswer === avail;
          const config = {
            yes: {
              label: 'Yes',
              active: 'bg-green-600 text-white border-green-600',
              inactive: 'bg-white text-green-700 border-green-300 hover:bg-green-50',
            },
            maybe: {
              label: 'Maybe',
              active: 'bg-amber-500 text-white border-amber-500',
              inactive: 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50',
            },
            no: {
              label: 'No',
              active: 'bg-red-600 text-white border-red-600',
              inactive: 'bg-white text-red-600 border-red-300 hover:bg-red-50',
            },
          }[avail];

          return (
            <button
              key={avail}
              type="button"
              disabled={disabled}
              onClick={() => onRespond(avail)}
              aria-pressed={isActive}
              aria-label={`${config.label}${isActive ? ' (selected)' : ''}`}
              className={`
                flex-1 py-2 rounded-xl text-sm font-semibold border transition-all
                min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500
                disabled:opacity-50 disabled:pointer-events-none
                ${isActive ? config.active : config.inactive}
              `}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Score summary */}
      <div className="flex justify-between text-xs text-gray-400" aria-label="Response summary">
        <span className="text-green-600 font-medium">{yesCount} yes</span>
        <span className="text-amber-500 font-medium">{maybeCount} maybe</span>
        <span className="text-red-500 font-medium">{noCount} no</span>
      </div>
    </article>
  );
}
