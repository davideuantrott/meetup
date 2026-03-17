import { useState } from 'react';
import type { Reaction } from '../../types';
import { QUICK_REACTIONS } from '../../types';
import { Avatar } from '../ui/Avatar';
import { format, parseISO } from 'date-fns';

interface ReactionsBarProps {
  reactions: Reaction[];
  onReact: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function ReactionsBar({ reactions, onReact, disabled }: ReactionsBarProps) {
  const [sending, setSending] = useState<string | null>(null);

  async function handleReact(content: string) {
    if (disabled) return;
    setSending(content);
    await onReact(content);
    setSending(null);
  }

  return (
    <section aria-labelledby="reactions-heading" className="flex flex-col gap-3">
      <h2
        id="reactions-heading"
        className="text-[0.8125rem] font-medium text-[#9E9E9E] uppercase tracking-wider"
      >
        Quick reactions
      </h2>

      {/* Reactions feed */}
      {reactions.length > 0 && (
        <ul
          className="flex flex-col gap-2.5 max-h-40 overflow-y-auto"
          role="list"
          aria-label="Reactions"
          aria-live="polite"
        >
          {reactions.map(r => (
            <li key={r.id} className="flex items-start gap-2.5">
              {r.user && <Avatar user={r.user} size="xs" />}
              <div className="bg-[#F5F7F2] rounded-[12px_12px_12px_4px] px-3 py-2 flex flex-col gap-0.5">
                <span className="text-[0.875rem] text-[#1A1A1A]">{r.content}</span>
                <span className="text-[0.6875rem] text-[#9E9E9E]">
                  {r.user?.name.split(' ')[0]} · {format(parseISO(r.created_at), 'HH:mm')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reaction buttons */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
        role="group"
        aria-label="Send a quick reaction"
      >
        {QUICK_REACTIONS.map(content => (
          <button
            key={content}
            type="button"
            disabled={disabled || sending === content}
            onClick={() => handleReact(content)}
            className="
              shrink-0 px-4 py-2.5 rounded-full text-[0.8125rem] font-medium
              border border-[#D0D0D0] bg-white text-[#1A1A1A]
              hover:border-[#A4BC91] hover:bg-[#F2F5EE]
              transition-colors btn-press min-h-[44px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
              disabled:opacity-40 disabled:pointer-events-none
            "
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {content}
          </button>
        ))}
      </div>
    </section>
  );
}
