import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type NotificationEvent = 'created' | 'confirmed' | 'cancelled' | 'date_added' | 'date_removed';

const EVENT_MESSAGES: Record<NotificationEvent, (title: string) => { subject: string; body: string }> = {
  created: (title) => ({
    subject: `New meetup: ${title}`,
    body: `A new meetup has been created: "${title}". Pick your dates.`,
  }),
  confirmed: (title) => ({
    subject: `Confirmed: ${title}`,
    body: `"${title}" has been confirmed. Check the details.`,
  }),
  cancelled: (title) => ({
    subject: `Cancelled: ${title}`,
    body: `"${title}" has been cancelled. Back to WhatsApp.`,
  }),
  date_added: (title) => ({
    subject: `New date added: ${title}`,
    body: `A new date option has been added to "${title}". Go respond.`,
  }),
  date_removed: (title) => ({
    subject: `Date removed: ${title}`,
    body: `A date option has been removed from "${title}".`,
  }),
};

serve(async (req) => {
  try {
    const { meetupId, event } = await req.json() as { meetupId: string; event: NotificationEvent };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch meetup + group members
    const { data: meetup } = await supabase
      .from('meetups')
      .select('title, group_id, created_by')
      .eq('id', meetupId)
      .single();

    if (!meetup) return new Response('Not found', { status: 404 });

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, user:users(email, name)')
      .eq('group_id', meetup.group_id);

    if (!members) return new Response('OK');

    const messages = EVENT_MESSAGES[event]?.(meetup.title);
    if (!messages) return new Response('Unknown event', { status: 400 });

    const meetupUrl = `${APP_URL}/meetup/${meetupId}`;

    // Send push notifications where available
    const { data: pushSubs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', members.map((m: { user_id: string }) => m.user_id));

    // Push notifications (VAPID) — basic implementation
    // In production, use web-push library
    // For now, fall through to email

    // Send email via Resend to members without push
    const pushUserIds = new Set((pushSubs ?? []).map((p: { user_id: string }) => p.user_id));
    const emailTargets = members.filter((m: { user_id: string; user: { email: string; name: string } }) =>
      !pushUserIds.has(m.user_id) && m.user_id !== meetup.created_by
    );

    for (const member of emailTargets) {
      const user = (member as { user: { email: string; name: string } }).user;
      if (!user?.email) continue;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Swimming Pals Planner <noreply@your-domain.com>',
          to: user.email,
          subject: messages.subject,
          html: `
            <p>${messages.body}</p>
            <p><a href="${meetupUrl}">View meetup</a></p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-notification error:', e);
    return new Response('Internal error', { status: 500 });
  }
});
