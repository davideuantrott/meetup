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
        .maybeSingle();

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
    // Pre-generate ID so we can add the creator to group_members before SELECTing.
    // The groups SELECT policy uses is_group_member(), which requires membership to
    // exist first — so we must insert the member before we can read the group back.
    const groupId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from('groups')
      .insert({ id: groupId, name, created_by: creatorId });

    if (insertError) {
      console.error('[createGroup] groups insert failed:', insertError);
      return null;
    }

    // Add creator as member (now the SELECT policy will pass)
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: creatorId });

    if (memberError) {
      console.error('[createGroup] group_members insert failed:', memberError);
    }

    const { data: groupData, error: selectError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (selectError) console.error('[createGroup] groups select failed:', selectError);
    if (!groupData) return null;
    const g = groupData as Group;
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
