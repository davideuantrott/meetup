import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';

serve(async (req) => {
  try {
    const { email, inviteCode, groupName } = await req.json() as {
      email: string;
      inviteCode: string;
      groupName: string;
    };

    const inviteUrl = `${APP_URL}/join/${inviteCode}`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Swimming Pals Planner <noreply@your-domain.com>',
        to: email,
        subject: `You've been invited to ${groupName}`,
        html: `
          <p>You've been invited to join <strong>${groupName}</strong> on Swimming Pals Planner.</p>
          <p>It's a scheduling app. It replaces the WhatsApp thread where nobody can ever agree on a date.</p>
          <p><a href="${inviteUrl}">Join the group</a></p>
        `,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-invite error:', e);
    return new Response('Internal error', { status: 500 });
  }
});
