import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import type { ProposedSlot, Response, GroupMember } from '../types';

export function formatSlotDate(slot: ProposedSlot): string {
  return format(parseISO(slot.date), 'EEE d MMM');
}

export function formatSlotTime(slot: ProposedSlot): string | null {
  if (slot.time_type === 'none') return null;
  if (slot.time_type === 'specific') return slot.time_value ?? null;
  if (slot.time_type === 'window') {
    const w = slot.time_value;
    if (w === 'morning') return 'Morning';
    if (w === 'afternoon') return 'Afternoon';
    if (w === 'evening') return 'Evening';
    return w ?? null;
  }
  return null;
}

export function formatCountdown(date: string, time?: string | null): string {
  const now = new Date();
  const eventDate = parseISO(date);

  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    eventDate.setHours(hours, minutes ?? 0, 0, 0);
  }

  const daysDiff = differenceInDays(eventDate, now);
  const hoursDiff = differenceInHours(eventDate, now);

  if (daysDiff < 0) return 'Past event';
  if (daysDiff === 0 && hoursDiff <= 0) return 'Today';
  if (daysDiff === 0) return `Today — ${hoursDiff}h away`;
  if (daysDiff === 1) return 'Tomorrow';
  return `${daysDiff} days away`;
}

/**
 * Scores a slot by how many members can attend.
 * yes=2, maybe=1, no=0, no response=0
 */
export function scoreSlot(slot: ProposedSlot, _members: GroupMember[]): number {
  const responses = slot.responses ?? [];
  return responses.reduce((acc, r) => {
    if (r.availability === 'yes') return acc + 2;
    if (r.availability === 'maybe') return acc + 1;
    return acc;
  }, 0);
}

export function getBestSlot(slots: ProposedSlot[], members: GroupMember[]): ProposedSlot | null {
  if (slots.length === 0) return null;
  return slots.reduce((best, slot) =>
    scoreSlot(slot, members) >= scoreSlot(best, members) ? slot : best
  );
}

export function getYesCount(slot: ProposedSlot): number {
  return (slot.responses ?? []).filter(r => r.availability === 'yes').length;
}

export function getMaybeCount(slot: ProposedSlot): number {
  return (slot.responses ?? []).filter(r => r.availability === 'maybe').length;
}

export function getNoCount(slot: ProposedSlot): number {
  return (slot.responses ?? []).filter(r => r.availability === 'no').length;
}

export function getUserResponse(slot: ProposedSlot, userId: string): Response | undefined {
  return (slot.responses ?? []).find(r => r.user_id === userId);
}
