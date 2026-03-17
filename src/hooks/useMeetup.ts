import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Meetup, ProposedSlot, Availability, Reaction } from '../types';

export function useMeetup(meetupId: string | undefined) {
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchMeetup = useCallback(async () => {
    if (!meetupId) return;
    // Only show the full-page spinner on the very first load.
    // Background re-fetches (from Realtime) silently update state.
    if (!initialLoadDone.current) setLoading(true);
    setError(null);
    try {
      const [{ data: meetupData }, { data: reactionsData }] = await Promise.all([
        supabase
          .from('meetups')
          .select(`
            *,
            creator:users!meetups_created_by_fkey(*),
            slots:proposed_slots(
              *,
              responses(*, user:users(*))
            ),
            confirmed_details(*, slot:proposed_slots(*))
          `)
          .eq('id', meetupId)
          .single(),
        supabase
          .from('reactions')
          .select('*, user:users(*)')
          .eq('meetup_id', meetupId)
          .order('created_at', { ascending: true }),
      ]);

      if (meetupData) setMeetup(meetupData as Meetup);
      if (reactionsData) setReactions(reactionsData as Reaction[]);
    } catch {
      setError('Failed to load meetup');
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    fetchMeetup();
  }, [fetchMeetup]);

  // Real-time subscription
  useEffect(() => {
    if (!meetupId) return;

    const channel = supabase
      .channel(`meetup:${meetupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responses',
      }, () => fetchMeetup())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `meetup_id=eq.${meetupId}`,
      }, ({ new: newRow }) => {
        if (newRow && 'id' in newRow) {
          fetchMeetup();
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetups',
        filter: `id=eq.${meetupId}`,
      }, () => fetchMeetup())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'confirmed_details',
        filter: `meetup_id=eq.${meetupId}`,
      }, () => fetchMeetup())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetupId, fetchMeetup]);

  async function respond(slotId: string, userId: string, availability: Availability) {
    // Optimistic update — update local state immediately so the UI responds instantly
    setMeetup(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: prev.slots?.map(s => {
          if (s.id !== slotId) return s;
          const existing = (s.responses ?? []).findIndex(r => r.user_id === userId);
          const responses = existing >= 0
            ? (s.responses ?? []).map((r, i) => i === existing ? { ...r, availability } : r)
            : [...(s.responses ?? []), { id: `opt-${Date.now()}`, slot_id: slotId, user_id: userId, availability, updated_at: new Date().toISOString() }];
          return { ...s, responses };
        }),
      };
    });

    await supabase
      .from('responses')
      .upsert({ slot_id: slotId, user_id: userId, availability, updated_at: new Date().toISOString() },
        { onConflict: 'slot_id,user_id' });
  }

  async function addReaction(meetupId: string, userId: string, content: string) {
    await supabase.from('reactions').insert({ meetup_id: meetupId, user_id: userId, content });
  }

  async function confirmMeetup(meetupId: string, slotId: string) {
    await supabase.from('confirmed_details').insert({ meetup_id: meetupId, slot_id: slotId });
    await supabase.from('meetups').update({ status: 'confirmed' }).eq('id', meetupId);
    // Trigger notification edge function
    await supabase.functions.invoke('send-notification', {
      body: { meetupId, event: 'confirmed' },
    });
  }

  async function cancelMeetup(meetupId: string) {
    await supabase.from('meetups').update({ status: 'cancelled' }).eq('id', meetupId);
    await supabase.functions.invoke('send-notification', {
      body: { meetupId, event: 'cancelled' },
    });
  }

  async function addSlot(meetupId: string, slot: Omit<ProposedSlot, 'id' | 'meetup_id' | 'created_at' | 'responses'>) {
    await supabase.from('proposed_slots').insert({ ...slot, meetup_id: meetupId });
    await supabase.functions.invoke('send-notification', {
      body: { meetupId, event: 'date_added' },
    });
  }

  async function removeSlot(slotId: string, meetupId: string) {
    await supabase.from('proposed_slots').delete().eq('id', slotId);
    await supabase.functions.invoke('send-notification', {
      body: { meetupId, event: 'date_removed' },
    });
  }

  async function updateMeetup(meetupId: string, fields: { title?: string; location?: string | null; image_url?: string | null }) {
    const { error } = await supabase.from('meetups').update(fields).eq('id', meetupId);
    if (!error) {
      setMeetup(prev => prev ? { ...prev, ...fields } : prev);
    }
    return { error };
  }

  return {
    meetup,
    reactions,
    loading,
    error,
    respond,
    addReaction,
    confirmMeetup,
    cancelMeetup,
    addSlot,
    removeSlot,
    updateMeetup,
    refetch: fetchMeetup,
  };
}
