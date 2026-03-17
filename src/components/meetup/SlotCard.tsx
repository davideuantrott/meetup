import type { ProposedSlot, GroupMember, User, Availability } from '../../types';
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
  const totalVotes = yesCount + maybeCount + noCount;

  const cardBg = isBest ? 'bg-[#EBF0E6]' : 'bg-white';
  const cardShadow = isBest
    ? 'shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
    : 'shadow-[0_2px_8px_rgba(0,0,0,0.06)]';

  return (
    <article
      className={`
        flex-shrink-0 w-[260px] rounded-[20px] p-4 flex flex-col gap-4 snap-start
        ${cardBg} ${cardShadow}
      `}
      style={{ fontFamily: 'var(--font-body)' }}
      aria-label={`${formatSlotDate(slot)}${timeLabel ? `, ${timeLabel}` : ''}`}
    >
      {/* Date header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="text-[1.25rem] font-bold leading-tight text-[#1A1A1A] tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {formatSlotDate(slot)}
          </p>
          {timeLabel && (
            <p className="text-[0.8125rem] text-[#6B6B6B] capitalize mt-0.5">{timeLabel}</p>
          )}
        </div>
        {isBest && (
          <span className="bg-[#C8F542] text-[#1A1A1A] text-[0.6875rem] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">
            Best
          </span>
        )}
      </div>

      {/* Vote progress bar */}
      {totalVotes > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
          {yesCount > 0 && (
            <div className="bg-[#4CAF50] rounded-full" style={{ flex: yesCount }} />
          )}
          {maybeCount > 0 && (
            <div className="bg-[#FF9800] rounded-full" style={{ flex: maybeCount }} />
          )}
          {noCount > 0 && (
            <div className="bg-[#F44336] rounded-full" style={{ flex: noCount }} />
          )}
        </div>
      )}

      {/* Respondent avatars by group */}
      <div className="flex flex-col gap-2.5">
        {(['yes', 'maybe', 'no'] as Availability[]).map(avail => {
          const respondents = (slot.responses ?? [])
            .filter(r => r.availability === avail && r.user)
            .map(r => r.user!);
          if (respondents.length === 0) return null;

          const colours = {
            yes: 'text-[#2E7D32] bg-[#E8F5E9]',
            maybe: 'text-[#E65100] bg-[#FFF3E0]',
            no: 'text-[#C62828] bg-[#FFEBEE]',
          }[avail];
          const labels = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

          return (
            <div key={avail} className="flex items-center gap-2">
              <span className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${colours} shrink-0`}>
                {labels[avail]}
              </span>
              <div className="flex gap-1">
                {respondents.map(u => (
                  <Avatar key={u.id} user={u} availability={avail} size="xs" />
                ))}
              </div>
            </div>
          );
        })}

        {/* Non-responders */}
        {(() => {
          const respondedIds = new Set((slot.responses ?? []).map(r => r.user_id));
          const nonResponders = members.filter(m => !respondedIds.has(m.user_id) && m.user).map(m => m.user!);
          if (nonResponders.length === 0) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full text-[#9E9E9E] bg-[#F5F5F5] shrink-0">
                —
              </span>
              <div className="flex gap-1">
                {nonResponders.map(u => (
                  <Avatar key={u.id} user={u} hasNotResponded size="xs" />
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
          const cfg = {
            yes: {
              label: 'Yes',
              active: 'bg-[#4CAF50] text-white',
              idle: 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]',
            },
            maybe: {
              label: 'Maybe',
              active: 'bg-[#FF9800] text-white',
              idle: 'bg-[#FFF3E0] text-[#E65100] hover:bg-[#FFE0B2]',
            },
            no: {
              label: 'No',
              active: 'bg-[#F44336] text-white',
              idle: 'bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2]',
            },
          }[avail];

          return (
            <button
              key={avail}
              type="button"
              disabled={disabled}
              onClick={() => onRespond(avail)}
              aria-pressed={isActive}
              aria-label={`${cfg.label}${isActive ? ' (selected)' : ''}`}
              className={`
                flex-1 py-2.5 rounded-full text-[0.8125rem] font-semibold
                transition-all duration-[150ms] btn-press min-h-[44px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#5C8348]
                disabled:opacity-40 disabled:pointer-events-none
                ${isActive ? cfg.active : cfg.idle}
              `}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Tally */}
      <div className="flex justify-between text-[0.6875rem] font-medium" aria-label="Response tally">
        <span className="text-[#2E7D32]">{yesCount} yes</span>
        <span className="text-[#E65100]">{maybeCount} maybe</span>
        <span className="text-[#C62828]">{noCount} no</span>
      </div>
    </article>
  );
}
