import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { TimeType, TimeWindow } from '../types';

interface SlotInput {
  id: string;
  date: string;
  time_type: TimeType;
  time_value: string;
}

function emptySlot(): SlotInput {
  return { id: crypto.randomUUID(), date: '', time_type: 'none', time_value: '' };
}

export function CreateMeetup() {
  const { profile } = useAuth();
  const { group } = useGroup(profile?.id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [slots, setSlots] = useState<SlotInput[]>([emptySlot(), emptySlot(), emptySlot()]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateSlot(id: string, updates: Partial<SlotInput>) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Meetup needs a name.';
    if (slots.filter(s => s.date).length < 2) errs.slots = 'Add at least 2 date options.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !group) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: meetupData, error: meetupErr } = await supabase
        .from('meetups')
        .insert({ group_id: group.id, title: title.trim(), location: location.trim() || null, created_by: profile.id })
        .select().single();
      if (meetupErr || !meetupData) { setErrors({ submit: 'Failed to create meetup. Try again.' }); return; }
      await supabase.from('proposed_slots').insert(
        slots.filter(s => s.date).map(s => ({
          meetup_id: meetupData.id, date: s.date, time_type: s.time_type,
          time_value: s.time_type === 'none' ? null : s.time_value || null,
        }))
      );
      await supabase.functions.invoke('send-notification', { body: { meetupId: meetupData.id, event: 'created' } });
      navigate(`/meetup/${meetupData.id}?new=1`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header className="bg-[#F5F7F2] sticky top-0 z-10 pt-4 pb-2 px-5">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F7F2] text-[#6B6B6B] hover:bg-[#EBF0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <h1
            className="text-[1.375rem] font-bold text-[#1A1A1A] tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            New meetup
          </h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 pb-10">
        <div className="max-w-[480px] mx-auto">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Details card */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
              <Input
                label="Meetup name"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Curry night? Pub? Vague notions?"
                error={errors.title}
                autoFocus
              />
              <Input
                label="Location (optional)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="TBD"
              />
            </div>

            {/* Dates */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-[0.8125rem] font-medium text-[#9E9E9E] uppercase tracking-wider"
                >
                  Date options
                </h2>
                <span className="text-[0.75rem] text-[#9E9E9E]">2–5 options</span>
              </div>
              {errors.slots && (
                <p className="text-[0.8125rem] text-[#F44336] mb-3" role="alert">{errors.slots}</p>
              )}
              <div className="flex flex-col gap-3">
                {slots.map((slot, idx) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    index={idx}
                    canRemove={slots.length > 2}
                    onChange={u => updateSlot(slot.id, u)}
                    onRemove={() => removeSlot(slot.id)}
                  />
                ))}
                {slots.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setSlots(prev => [...prev, emptySlot()])}
                    className="flex items-center gap-2 text-[0.875rem] text-[#5C8348] font-medium hover:text-[#476834] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] rounded-lg py-2"
                  >
                    <Plus size={16} strokeWidth={2} />
                    Add another date
                  </button>
                )}
              </div>
            </section>

            {errors.submit && (
              <p className="text-[0.8125rem] text-[#F44336]" role="alert">{errors.submit}</p>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Publish meetup
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function SlotRow({ slot, index, canRemove, onChange, onRemove }: {
  slot: SlotInput; index: number; canRemove: boolean;
  onChange: (u: Partial<SlotInput>) => void; onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] font-medium text-[#9E9E9E]">Option {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove date option ${index + 1}`}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9E9E9E] hover:text-[#F44336] hover:bg-[#FFEBEE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F44336]"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`slot-date-${slot.id}`} className="text-[0.8125rem] font-medium text-[#1A1A1A]">
          Date
        </label>
        <input
          id={`slot-date-${slot.id}`}
          type="date"
          value={slot.date}
          onChange={e => onChange({ date: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className="w-full rounded-xl border border-[#D0D0D0] bg-[#FAFBF8] px-4 text-[1rem] min-h-[48px] focus:outline-none focus:border-[#5C8348] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[0.8125rem] font-medium text-[#1A1A1A]">Time</span>
        <div className="flex gap-2">
          {(['none', 'specific', 'window'] as TimeType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ time_type: t, time_value: '' })}
              aria-pressed={slot.time_type === t}
              className={`
                flex-1 py-2 px-3 rounded-full text-[0.8125rem] font-medium border transition-all duration-[150ms]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
                ${slot.time_type === t
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-transparent text-[#1A1A1A] border-[#D0D0D0] hover:border-[#A4BC91]'}
              `}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {t === 'none' ? 'None' : t === 'specific' ? 'Time' : 'Window'}
            </button>
          ))}
        </div>

        {slot.time_type === 'specific' && (
          <input
            type="time"
            value={slot.time_value}
            onChange={e => onChange({ time_value: e.target.value })}
            className="w-full rounded-xl border border-[#D0D0D0] bg-[#FAFBF8] px-4 text-[1rem] min-h-[48px] focus:outline-none focus:border-[#5C8348] transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
            aria-label="Specific time"
          />
        )}

        {slot.time_type === 'window' && (
          <div className="flex gap-2" role="group" aria-label="Time window">
            {(['morning', 'afternoon', 'evening'] as TimeWindow[]).map(w => (
              <button
                key={w}
                type="button"
                onClick={() => onChange({ time_value: w })}
                aria-pressed={slot.time_value === w}
                className={`
                  flex-1 py-2 px-2 rounded-full text-[0.8125rem] font-medium border capitalize transition-all duration-[150ms]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
                  ${slot.time_value === w
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-transparent text-[#1A1A1A] border-[#D0D0D0] hover:border-[#A4BC91]'}
                `}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
