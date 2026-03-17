# Swimming Pals Planner — Claude Code Guide

## What this project is

A Progressive Web App for a small friend group to coordinate one-off meetups. It replaces the WhatsApp date-pinning thread with a structured, personality-driven scheduling tool.

Full product spec: `SWIMMING-PALS-PLANNER.md`
Design system: `swimming-pals-design-system.jsonc`

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Email | Resend (via Edge Functions) |
| PWA | vite-plugin-pwa + Workbox (injectManifest strategy) |
| Push notifications | Web Push API via service worker |
| Icons | lucide-react (strokeWidth 1.75 throughout) |
| Typography | Nunito Sans (display) + DM Sans (body) via Google Fonts |
| Hosting | Vercel (frontend), Supabase (backend) |

---

## Project structure

```
src/
  components/
    group/        InvitePanel
    meetup/       MeetupCard, SlotCard, ReactionsBar, ConfirmedView
    notifications/ InstallPrompt
    ui/           Avatar, Button, Card, Input, Modal
  hooks/          useAuth, useGroup, useMeetup, useMeetups, usePushNotifications
  lib/            supabase.ts (Supabase client)
  pages/          SignIn, AuthCallback, CreateGroup, JoinGroup, Home, CreateMeetup, MeetupView
  providers/      AuthProvider
  types/          index.ts (all shared types)
  utils/          commentary.ts, slots.ts
supabase/
  functions/      send-notification, send-nudges, send-invite (Deno Edge Functions)
  migrations/     001_initial_schema.sql, 002_cron.sql
public/
  sw.js           Service worker (push handler + Workbox manifest placeholder)
```

---

## Running locally

```bash
# Install deps
npm install --legacy-peer-deps

# Copy env and fill in values
cp .env.example .env

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Environment variables

See `.env.example`. Required:

```
VITE_SUPABASE_URL        — Supabase project URL
VITE_SUPABASE_ANON_KEY   — Supabase anon key
VITE_APP_URL             — Public app URL (used for invite/share links)
VITE_VAPID_PUBLIC_KEY    — VAPID public key for Web Push (optional — push degrades to email)
```

Edge Function secrets (set in Supabase dashboard):
```
RESEND_API_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_URL
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

---

## Design system

All visual decisions come from `swimming-pals-design-system.jsonc`. Key rules:

- **Brand colour:** sage green family (`#5C8348` core, `#F2F5EE`–`#1A2B12` scale)
- **Accent:** chartreuse `#C8F542` — primary CTAs and active states **only**. Nowhere else.
- **Backgrounds:** warm off-whites (`#F5F7F2`, `#EBF0E6`, `#FAFBF8`). No cool greys.
- **Text:** `#1A1A1A` primary, `#6B6B6B` secondary, `#9E9E9E` tertiary
- **Buttons:** pill-shaped (`border-radius: 9999px`). Primary = chartreuse. Secondary = outline.
- **Cards:** borderless, soft shadow `0 2px 8px rgba(0,0,0,0.06)`, 16px radius
- **Typography:** Nunito Sans (display, 200–900 weight range) + DM Sans (body). Use the bold/light weight contrast pattern (800 heading + 300 subheading) for screen titles.
- **Icons:** lucide-react, `strokeWidth={1.75}`, size 20–24px
- **Touch targets:** 44px minimum on all interactive elements
- **Focus rings:** `outline: 2px solid #5C8348`, offset 2px
- **Tone:** dry, deadpan — see `src/utils/commentary.ts` for copy patterns

CSS custom properties for all tokens are defined in `src/index.css` under `@theme`.

---

## Data model (summary)

```
users → groups → group_members
                      ↓
                   meetups → proposed_slots → responses
                          ↓                ↓
                   confirmed_details    reactions
```

Full schema with RLS policies: `supabase/migrations/001_initial_schema.sql`

All tables have Row Level Security. Users can only access data for groups they belong to. Use the service role key only in Edge Functions.

---

## Auth flow

1. Sign in via Google OAuth or email/password (Supabase Auth)
2. OAuth redirects to `/auth/callback` → `AuthCallback.tsx` creates profile row if missing
3. Invite links: `/join/:inviteCode` — `sessionStorage` preserves the invite code through the OAuth redirect so group joining is automatic post-auth
4. `RequireAuth` wraps all protected routes; `RequireGroup` redirects to `/create-group` if user has no group

---

## Key behaviours

- **Realtime:** `useMeetup` and `useMeetups` subscribe to Supabase Realtime channels. All response, reaction, and meetup status changes propagate live.
- **Commentary engine:** `src/utils/commentary.ts` — generates deadpan copy based on response state. All copy is placeholder; product owner will customise.
- **Best slot scoring:** `src/utils/slots.ts` `scoreSlot()` — yes=2, maybe=1, no=0. Highest-scoring slot gets the "Best" badge and is pre-selected for confirmation.
- **Offline:** Workbox caches app shell (cache-first) and Supabase responses (stale-while-revalidate). Response mutations queue via background sync.
- **Nudges:** `supabase/functions/send-nudges` runs on a cron trigger, sends 3 escalating nudges at 12h / 24h / 48h, then stops.

---

## Setup status (as of 2026-03-17)

- [x] Dependencies installed (`npm install --legacy-peer-deps`)
- [x] `.env` configured with Supabase URL, anon key, app URL, and VAPID public key
- [x] Database migrations run in Supabase SQL Editor (001 + 002)
- [x] Google OAuth configured (Google Cloud Console + Supabase Auth provider)
- [x] Dev server running (`npm run dev`) — Google sign-in confirmed working
- [ ] Edge Functions deployed (send-notification, send-nudges, send-invite)
- [ ] Resend API key added to Supabase Edge Function secrets
- [ ] VAPID private key added to Supabase Edge Function secrets
- [ ] Nudge cron wired up (needs `pg_cron` on Pro, or external scheduler on free tier)

---

## What's not built yet (from the spec)

- OG image generation for WhatsApp preview cards (spec item 15)
- Nudge cron trigger wiring (the function exists; needs `pg_cron` or external scheduler)
- VAPID push signing in `send-notification` (currently falls back to email for all users)
- Customisable avatar colours in settings
- Multiple groups UI (data model supports it; UI assumes one group per user)
