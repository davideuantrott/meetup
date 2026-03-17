export type Availability = 'yes' | 'maybe' | 'no';
export type MeetupStatus = 'open' | 'confirmed' | 'cancelled' | 'archived';
export type TimeType = 'specific' | 'window' | 'none';
export type TimeWindow = 'morning' | 'afternoon' | 'evening';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_colour: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: User;
}

export interface Meetup {
  id: string;
  group_id: string;
  title: string;
  location: string | null;
  created_by: string;
  status: MeetupStatus;
  created_at: string;
  slots?: ProposedSlot[];
  confirmed_details?: ConfirmedDetails;
  creator?: User;
}

export interface ProposedSlot {
  id: string;
  meetup_id: string;
  date: string;
  time_type: TimeType;
  time_value: string | null;
  created_at: string;
  responses?: Response[];
}

export interface Response {
  id: string;
  slot_id: string;
  user_id: string;
  availability: Availability;
  updated_at: string;
  user?: User;
}

export interface Reaction {
  id: string;
  meetup_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface ConfirmedDetails {
  meetup_id: string;
  slot_id: string;
  confirmed_at: string;
  slot?: ProposedSlot;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export const QUICK_REACTIONS = [
  'Works for me',
  'Can we do later?',
  'Can we do earlier?',
  "I'll sort it",
  'Running late (already)',
] as const;

export type QuickReaction = typeof QUICK_REACTIONS[number];

export const AVATAR_COLOURS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];
