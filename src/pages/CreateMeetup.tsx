import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

  function addSlot() {
    if (slots.length < 5) setSlots(prev => [...prev, emptySlot()]);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Meetup needs a name.';
    const validSlots = slots.filter(s => s.date);
    if (validSlots.length < 2) errs.slots = 'Add at least 2 date options.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !group) return;
    if (!validate()) return;

    setLoading(true);
    try {
      // Create meetup
      const { data: meetupData, error: meetupErr } = await supabase
        .from('meetups')
        .insert({
          group_id: group.id,
          title: title.trim(),
          location: location.trim() || null,
          created_by: profile.id,
        })
        .select()
        .single();

      if (meetupErr || !meetupData) {
        setErrors({ submit: 'Failed to create meetup. Try again.' });
        return;
      }

      // Insert slots
      const slotRows = slots
        .filter(s => s.date)
        .map(s => ({
          meetup_id: meetupData.id,
          date: s.date,
          time_type: s.time_type,
          time_value: s.time_type === 'none' ? null : s.time_value || null,
        }));

      await supabase.from('proposed_slots').insert(slotRows);

      // Notify group
      await supabase.functions.invoke('send-notification', {
        body: { meetupId: meetupData.id, event: 'created' },
      });

      navigate(`/meetup/${meetupData.id}?new=1`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-gray-900">New meetup</h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
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

          <section aria-labelledby="dates-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="dates-heading" className="font-semibold text-gray-700">Date options</h2>
              <span className="text-xs text-gray-400">2–5 options</span>
            </div>

            {errors.slots && (
              <p className="text-sm text-red-600" role="alert">{errors.slots}</p>
            )}

            {slots.map((slot, idx) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                index={idx}
                canRemove={slots.length > 2}
                onChange={updates => updateSlot(slot.id, updates)}
                onRemove={() => removeSlot(slot.id)}
              />
            ))}

            {slots.length < 5 && (
              <button
                type="button"
                onClick={addSlot}
                className="text-sm text-indigo-600 hover:text-indigo-800 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                + Add another date
              </button>
            )}
          </section>

          {errors.submit && (
            <p className="text-sm text-red-600" role="alert">{errors.submit}</p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full">
            Publish meetup
          </Button>
        </form>
      </main>
    </div>
  );
}

interface SlotRowProps {
  slot: SlotInput;
  index: number;
  canRemove: boolean;
  onChange: (updates: Partial<SlotInput>) => void;
  onRemove: () => void;
}

function SlotRow({ slot, index, canRemove, onChange, onRemove }: SlotRowProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Option {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove date option ${index + 1}`}
            className="text-xs text-red-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`slot-date-${slot.id}`} className="text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id={`slot-date-${slot.id}`}
            type="date"
            value={slot.date}
            onChange={e => onChange({ date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Time</span>
          <div className="flex gap-2">
            {(['none', 'specific', 'window'] as TimeType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ time_type: t, time_value: '' })}
                className={`
                  flex-1 py-2 px-3 rounded-xl text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                  ${slot.time_type === t
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}
                `}
                aria-pressed={slot.time_type === t}
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
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
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
                  className={`
                    flex-1 py-2 px-2 rounded-xl text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 capitalize
                    ${slot.time_value === w
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}
                  `}
                  aria-pressed={slot.time_value === w}
                >
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
