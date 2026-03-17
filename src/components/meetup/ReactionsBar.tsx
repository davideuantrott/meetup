import { useState } from 'react';
import type { Reaction, User } from '../../types';
import { QUICK_REACTIONS } from '../../types';
import { Avatar } from '../ui/Avatar';
import { format, parseISO } from 'date-fns';

interface ReactionsBarProps {
  reactions: Reaction[];
  currentUser?: User;
  onReact: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function ReactionsBar({ reactions, onReact, disabled }: ReactionsBarProps) {
  const [sending, setSending] = useState<string | null>(null);

  async function handleReact(content: string) {
    setSending(content);
    await onReact(content);
    setSending(null);
  }

  return (
    <section aria-labelledby="reactions-heading" className="flex flex-col gap-3">
      <h2 id="reactions-heading" className="sr-only">Quick reactions</h2>

      {/* Reactions feed */}
      {reactions.length > 0 && (
        <ul
          className="flex flex-col gap-2 max-h-40 overflow-y-auto"
          role="list"
          aria-label="Reactions"
          aria-live="polite"
        >
          {reactions.map(r => (
            <li key={r.id} className="flex items-center gap-2">
              {r.user && <Avatar user={r.user} size="sm" />}
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{r.content}</span>
                <span className="text-xs text-gray-400">
                  {r.user?.name.split(' ')[0]} · {format(parseISO(r.created_at), 'HH:mm')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reaction buttons */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
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
              shrink-0 px-3 py-2 rounded-xl text-sm border border-gray-200
              bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
              disabled:opacity-50 disabled:pointer-events-none min-h-[44px]
            "
          >
            {content}
          </button>
        ))}
      </div>
    </section>
  );
}
