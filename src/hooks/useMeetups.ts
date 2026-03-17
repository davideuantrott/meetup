import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Meetup } from '../types';

export function useMeetups(groupId: string | undefined) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetups = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
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
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMeetups((data ?? []) as Meetup[]);
    } catch {
      setError('Failed to load meetups');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMeetups();
  }, [fetchMeetups]);

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`meetups:${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetups',
        filter: `group_id=eq.${groupId}`,
      }, () => fetchMeetups())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responses',
      }, () => fetchMeetups())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
      }, () => fetchMeetups())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'confirmed_details',
      }, () => fetchMeetups())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, fetchMeetups]);

  const activeMeetups = meetups.filter(m => m.status === 'open' || m.status === 'confirmed');
  const archivedMeetups = meetups.filter(m => m.status === 'archived' || m.status === 'cancelled');

  return { meetups, activeMeetups, archivedMeetups, loading, error, refetch: fetchMeetups };
}
