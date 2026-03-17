import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Group, GroupMember } from '../types';

export function useGroup(userId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchGroup(userId);
  }, [userId]);

  async function fetchGroup(uid: string) {
    setLoading(true);
    setError(null);
    try {
      // Find the first group the user belongs to
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', uid)
        .limit(1)
        .single();

      if (!membership) {
        setGroup(null);
        setMembers([]);
        return;
      }

      const [{ data: groupData }, { data: membersData }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', membership.group_id).single(),
        supabase
          .from('group_members')
          .select('*, user:users(*)')
          .eq('group_id', membership.group_id),
      ]);

      if (groupData) setGroup(groupData as Group);
      if (membersData) setMembers(membersData as GroupMember[]);
    } catch (e) {
      setError('Failed to load group');
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(name: string, creatorId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, created_by: creatorId })
      .select()
      .single();

    if (error || !data) return null;
    const g = data as Group;

    // Add creator as member
    await supabase.from('group_members').insert({ group_id: g.id, user_id: creatorId });

    setGroup(g);
    await fetchGroup(creatorId);
    return g;
  }

  async function joinGroupByCode(inviteCode: string, userId: string): Promise<{ error: string | null }> {
    const { data: groupData } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (!groupData) return { error: 'Invalid invite link.' };

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupData.id, user_id: userId });

    if (error && error.code !== '23505') {
      return { error: 'Failed to join group.' };
    }

    await fetchGroup(userId);
    return { error: null };
  }

  async function inviteByEmail(
    email: string,
    groupId: string,
    inviteCode: string,
    groupName: string
  ): Promise<{ error: string | null }> {
    // Call Supabase Edge Function to send invite email via Resend
    const { error } = await supabase.functions.invoke('send-invite', {
      body: { email, groupId, inviteCode, groupName },
    });
    if (error) return { error: 'Failed to send invite email.' };
    return { error: null };
  }

  async function updateGroupName(groupId: string, name: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('groups').update({ name }).eq('id', groupId);
    if (error) return { error: 'Failed to update group name.' };
    setGroup(prev => prev ? { ...prev, name } : prev);
    return { error: null };
  }

  return {
    group,
    members,
    loading,
    error,
    createGroup,
    joinGroupByCode,
    inviteByEmail,
    updateGroupName,
    refetch: () => userId && fetchGroup(userId),
  };
}
