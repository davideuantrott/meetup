import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function is called by a cron trigger every hour
// It checks for non-responders and sends up to 3 nudges

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const NUDGE_INTERVALS_HOURS = [12, 24, 48];

const NUDGE_MESSAGES = [
  (name: string) => `${name} hasn't responded. They're probably busy. Probably.`,
  (name: string) => `${name}. Mate. It's one button.`,
  (name: string) => `At this point ${name} is making a statement.`,
];

serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date();

  // Get all open meetups created more than 12 hours ago
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const { data: meetups } = await supabase
    .from('meetups')
    .select('id, title, group_id, created_at')
    .eq('status', 'open')
    .lt('created_at', twelveHoursAgo);

  if (!meetups) return new Response('OK');

  for (const meetup of meetups) {
    const meetupAge = (now.getTime() - new Date(meetup.created_at).getTime()) / (1000 * 60 * 60);

    // Determine which nudge number applies based on meetup age
    let nudgeNumber = 0;
    for (let i = NUDGE_INTERVALS_HOURS.length - 1; i >= 0; i--) {
      if (meetupAge >= NUDGE_INTERVALS_HOURS[i]) {
        nudgeNumber = i + 1;
        break;
      }
    }

    if (nudgeNumber === 0) continue;

    // Get group members
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, user:users(name, email)')
      .eq('group_id', meetup.group_id);

    if (!members) continue;

    // Get slots and responses for this meetup
    const { data: slots } = await supabase
      .from('proposed_slots')
      .select('id')
      .eq('meetup_id', meetup.id);

    const slotIds = (slots ?? []).map((s: { id: string }) => s.id);
    const { data: responses } = await supabase
      .from('responses')
      .select('user_id')
      .in('slot_id', slotIds);

    const respondedUserIds = new Set((responses ?? []).map((r: { user_id: string }) => r.user_id));

    for (const member of members) {
      if (respondedUserIds.has(member.user_id)) continue;
      const user = (member as { user_id: string; user: { name: string; email: string } }).user;
      if (!user?.email) continue;

      // Check if this nudge was already sent
      const { data: existing } = await supabase
        .from('nudge_log')
        .select('id')
        .eq('meetup_id', meetup.id)
        .eq('user_id', member.user_id)
        .eq('nudge_number', nudgeNumber)
        .single();

      if (existing) continue;

      // Send nudge
      const message = NUDGE_MESSAGES[nudgeNumber - 1](user.name);
      const meetupUrl = `${APP_URL}/meetup/${meetup.id}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Swimming Pals Planner <noreply@your-domain.com>',
          to: user.email,
          subject: `Reminder: ${meetup.title}`,
          html: `
            <p>${message}</p>
            <p><a href="${meetupUrl}">Go respond now.</a></p>
          `,
        }),
      });

      // Log the nudge
      await supabase.from('nudge_log').insert({
        meetup_id: meetup.id,
        user_id: member.user_id,
        nudge_number: nudgeNumber,
      });
    }
  }

  // Archive past confirmed meetups
  await supabase.rpc('archive_past_meetups');

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
