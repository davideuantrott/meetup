import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
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
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const feedRef = useRef<HTMLUListElement>(null);

  // Auto-scroll to bottom when new reactions arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [reactions.length]);

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    await onReact(trimmed);
    setSending(false);
    setDraft('');
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend(draft);
    }
  }

  return (
    <section aria-labelledby="chat-heading" className="flex flex-col gap-3">
      <h2
        id="chat-heading"
        className="text-[0.8125rem] font-medium text-[#9E9E9E] uppercase tracking-wider"
      >
        Chat
      </h2>

      {/* Message feed */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        {reactions.length === 0 ? (
          <p className="text-[0.8125rem] text-[#9E9E9E] italic text-center py-6 px-4">
            Nothing yet. Someone say something.
          </p>
        ) : (
          <ul
            ref={feedRef}
            className="flex flex-col gap-1 max-h-52 overflow-y-auto px-4 py-4"
            role="list"
            aria-label="Chat messages"
            aria-live="polite"
          >
            {reactions.map(r => (
              <li key={r.id} className="flex items-start gap-2.5">
                {r.user && <Avatar user={r.user} size="xs" />}
                <div className="bg-[#F5F7F2] rounded-[4px_12px_12px_12px] px-3 py-2 flex flex-col gap-0.5 max-w-[85%]">
                  <span className="text-[0.875rem] text-[#1A1A1A] leading-snug">{r.content}</span>
                  <span className="text-[0.6875rem] text-[#9E9E9E]">
                    {r.user?.name.split(' ')[0]} · {format(parseISO(r.created_at), 'HH:mm')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Quick reaction chips */}
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-[#F0F0F0] no-scrollbar"
          role="group"
          aria-label="Quick replies"
        >
          {QUICK_REACTIONS.map(content => (
            <button
              key={content}
              type="button"
              disabled={disabled || sending}
              onClick={() => handleSend(content)}
              className="
                shrink-0 px-3 py-1.5 rounded-full text-[0.75rem] font-medium
                border border-[#D0D0D0] bg-white text-[#1A1A1A]
                hover:border-[#A4BC91] hover:bg-[#F2F5EE]
                transition-colors btn-press
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
                disabled:opacity-40 disabled:pointer-events-none
              "
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {content}
            </button>
          ))}
        </div>

        {/* Text input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#F0F0F0]">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Meetup closed' : 'Say something…'}
            maxLength={280}
            className="
              flex-1 bg-[#F5F7F2] rounded-full px-4 py-2 text-[0.875rem] text-[#1A1A1A]
              placeholder:text-[#9E9E9E] min-h-[40px]
              focus:outline-none focus:ring-2 focus:ring-[#5C8348]
              disabled:opacity-40
            "
            style={{ fontFamily: 'var(--font-body)' }}
            aria-label="Type a message"
          />
          <button
            type="button"
            disabled={disabled || sending || !draft.trim()}
            onClick={() => handleSend(draft)}
            aria-label="Send"
            className="
              w-10 h-10 rounded-full bg-[#C8F542] flex items-center justify-center shrink-0
              hover:bg-[#B8E035] transition-colors btn-press
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
              disabled:opacity-40 disabled:pointer-events-none
            "
          >
            <Send size={16} strokeWidth={2} color="#1A1A1A" />
          </button>
        </div>
      </div>
    </section>
  );
}
