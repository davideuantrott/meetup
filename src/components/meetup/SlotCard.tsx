import { Check } from 'lucide-react';
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
      className={`w-full rounded-[20px] p-5 flex flex-col gap-4 ${cardBg} ${cardShadow}`}
      style={{ fontFamily: 'var(--font-body)' }}
      aria-label={`${formatSlotDate(slot)}${timeLabel ? `, ${timeLabel}` : ''}`}
    >
      {/* Date / time header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="text-[1.375rem] font-bold leading-tight text-[#1A1A1A] tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {formatSlotDate(slot)}
          </p>
          {timeLabel && (
            <p className="text-[0.875rem] text-[#6B6B6B] capitalize mt-0.5">{timeLabel}</p>
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
            <div className="bg-[#5C8348] rounded-full" style={{ flex: yesCount }} />
          )}
          {maybeCount > 0 && (
            <div className="bg-[#A4BC91] rounded-full" style={{ flex: maybeCount }} />
          )}
          {noCount > 0 && (
            <div className="bg-[#D0D0D0] rounded-full" style={{ flex: noCount }} />
          )}
        </div>
      )}

      {/* Responses so far: avatars grouped by answer */}
      <div className="flex flex-col gap-2" aria-label="Responses so far">
        {(['yes', 'maybe', 'no'] as Availability[]).map(avail => {
          const respondents = (slot.responses ?? [])
            .filter(r => r.availability === avail && r.user)
            .map(r => r.user!);
          if (respondents.length === 0) return null;

          const labelCfg = {
            yes: { text: 'Yes', cls: 'text-[#3D6B2C] bg-[#D6ECC8]' },
            maybe: { text: 'Maybe', cls: 'text-[#5C8348] bg-[#EBF0E6]' },
            no: { text: 'No', cls: 'text-[#9E9E9E] bg-[#F0F0F0]' },
          }[avail];

          return (
            <div key={avail} className="flex items-center gap-2">
              <span className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full shrink-0 ${labelCfg.cls}`}>
                {labelCfg.text}
              </span>
              <div className="flex gap-1 flex-wrap">
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
              <div className="flex gap-1 flex-wrap">
                {nonResponders.map(u => (
                  <Avatar key={u.id} user={u} hasNotResponded size="xs" />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Response buttons */}
      <div className="flex gap-2" role="group" aria-label="Your response">
        {(['yes', 'maybe', 'no'] as Availability[]).map(avail => {
          const isActive = currentAnswer === avail;

          // Brand-aligned colours
          const cfg = {
            yes: {
              label: 'Yes',
              active: 'bg-[#C8F542] text-[#1A1A1A] shadow-[0_2px_8px_rgba(200,245,66,0.4)]',
              idle: 'bg-[#EBF0E6] text-[#5C8348] hover:bg-[#D6E4CC]',
            },
            maybe: {
              label: 'Maybe',
              active: 'bg-[#5C8348] text-white shadow-[0_2px_8px_rgba(92,131,72,0.3)]',
              idle: 'bg-transparent border border-[#A4BC91] text-[#5C8348] hover:bg-[#F2F5EE]',
            },
            no: {
              label: 'No',
              active: 'bg-[#9E9E9E] text-white',
              idle: 'bg-[#F0F0F0] text-[#6B6B6B] hover:bg-[#E0E0E0]',
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
                flex items-center justify-center gap-1.5
                transition-all duration-[150ms] btn-press min-h-[44px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#5C8348]
                disabled:opacity-40 disabled:pointer-events-none
                ${isActive ? cfg.active : cfg.idle}
              `}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {isActive && <Check size={13} strokeWidth={2.5} aria-hidden="true" />}
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Tally */}
      <div className="flex justify-between text-[0.6875rem] font-medium" aria-label="Response tally">
        <span className="text-[#3D6B2C]">{yesCount} yes</span>
        <span className="text-[#5C8348]">{maybeCount} maybe</span>
        <span className="text-[#9E9E9E]">{noCount} no</span>
      </div>
    </article>
  );
}
