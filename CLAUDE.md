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
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| Email | Resend (custom SMTP for Supabase Auth + Edge Functions) |
| PWA | vite-plugin-pwa + Workbox (injectManifest strategy) |
| Push notifications | Web Push API via service worker |
| Icons | lucide-react (strokeWidth 1.75 throughout) |
| Typography | Nunito Sans (display) + DM Sans (body) via Google Fonts |
| Hosting | GitHub Pages (frontend), Supabase (backend) |

---

## Project structure

```
src/
  components/
    group/        InvitePanel
    meetup/       MeetupCard, SlotCard, ReactionsBar, ConfirmedView
    notifications/ InstallPrompt
    ui/           Avatar, Button, Card, Input, Modal, ImageUpload
  hooks/          useAuth, useGroup, useMeetup, useMeetups, usePushNotifications
  lib/            supabase.ts (Supabase client)
  pages/          SignIn, AuthCallback, CreateGroup, JoinGroup, Home, CreateMeetup, MeetupView
  providers/      AuthProvider
  types/          index.ts (all shared types)
  utils/          commentary.ts, slots.ts
supabase/
  functions/      send-notification, send-nudges, send-invite (Deno Edge Functions)
  migrations/     001_initial_schema.sql, 002_cron.sql, 003_avatars_and_images.sql
public/
  sw.js           Service worker (push handler + Workbox manifest placeholder)
  site.webmanifest PWA manifest
  icon-*.png      PWA icons (48–512px), apple-touch-icon, favicon variants
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
VITE_APP_URL             — Public app URL, no trailing slash: https://davideuantrott.github.io/meetup
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
- **Tone:** dry, deadpan — see `src/utils/commentary.ts` for copy patterns. Always use first name only (not full name).

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
Avatar and image columns: `supabase/migrations/003_avatars_and_images.sql`

All tables have Row Level Security. Users can only access data for groups they belong to. Use the service role key only in Edge Functions.

Key columns added in migration 003:
- `users.avatar_url` — Google profile photo URL, refreshed on every sign-in
- `groups.image_url` — optional group photo, uploaded via Supabase Storage
- `meetups.image_url` — optional meetup hero image, uploaded via Supabase Storage

---

## Auth flow

1. Sign in via Google OAuth or email/password (Supabase Auth)
2. Google OAuth redirects to `/auth/callback` → `AuthCallback.tsx` creates/updates profile row
3. Email sign-up: profile row is created immediately in `signUpWithEmail`; confirmation email sends user to `/auth/callback` via `emailRedirectTo`
4. Invite links: `/join/:inviteCode` — `sessionStorage` preserves the invite code through the OAuth redirect so group joining is automatic post-auth
5. `RequireAuth` wraps all protected routes; `RequireGroup` redirects to `/create-group` if user has no group

---

## Key behaviours

- **Realtime:** `useMeetup` and `useMeetups` subscribe to Supabase Realtime channels. All response, reaction, and meetup status changes propagate live.
- **Optimistic updates:** `respond()` in `useMeetup` updates local state immediately before the Supabase upsert resolves, so Yes/Maybe/No buttons feel instant.
- **Background re-fetches:** `fetchMeetup` only shows the loading spinner on the very first load. Realtime-triggered re-fetches update state silently.
- **Commentary engine:** `src/utils/commentary.ts` — generates deadpan copy based on response state. Always uses first name only. All copy is placeholder; product owner will customise.
- **Best slot scoring:** `src/utils/slots.ts` `scoreSlot()` — yes=2, maybe=1, no=0. Highest-scoring slot gets the "Best" badge and is pre-selected for confirmation.
- **Image upload:** `src/components/ui/ImageUpload.tsx` — uploads to Supabase Storage bucket `images` under `{userId}/{timestamp}.{ext}`. Requires the bucket to exist and be public (see setup checklist).
- **Offline:** Workbox caches app shell (cache-first) and Supabase responses (stale-while-revalidate). Response mutations queue via background sync.
- **Nudges:** `supabase/functions/send-nudges` runs on a cron trigger, sends 3 escalating nudges at 12h / 24h / 48h, then stops.

---

## Layout

- **Mobile:** single column, full width with padding
- **Tablet/desktop (`lg` breakpoint):** MeetupView uses a two-column grid (commentary + chat left, slot cards right). Home shows meetup cards in a 2–3 column grid.
- **Slot cards:** stacked vertically (not a horizontal carousel). Each card: date/time → progress bar → avatars by response → Yes/Maybe/No buttons (with ✓ on selected) → tally.

---

## Setup status (as of 2026-03-19)

- [x] Dependencies installed (`npm install --legacy-peer-deps`)
- [x] `.env` configured with Supabase URL, anon key, app URL, and VAPID public key
- [x] Database migrations run in Supabase SQL Editor (001 + 002 + 003)
- [x] Google OAuth configured (Google Cloud Console + Supabase Auth provider)
- [x] Email/password auth working (Resend custom SMTP configured in Supabase)
- [x] Dev server running (`npm run dev`) — Google sign-in confirmed working
- [x] Deployed to GitHub Pages at `https://davideuantrott.github.io/meetup`
- [x] GitHub Actions workflow building and deploying on every push to `main`
- [x] Google OAuth sign-in working on live site
- [x] Email/password sign-up working on live site
- [x] Group creation working on live site
- [x] PWA icons created and wired up (all sizes in `/public/`)
- [ ] Supabase Storage bucket `images` created (public, with RLS policies — see migration 003 comments)
- [ ] Edge Functions deployed (send-notification, send-nudges, send-invite)
- [ ] Resend API key added to Supabase Edge Function secrets
- [ ] VAPID private key added to Supabase Edge Function secrets
- [ ] Nudge cron wired up (needs `pg_cron` on Pro, or external scheduler on free tier)

---

## Known fixes applied

- `vite.config.ts`: added `base: '/meetup/'` for GitHub Pages subdirectory
- `src/App.tsx`: added `basename="/meetup"` to `BrowserRouter`
- `src/hooks/useAuth.ts`: `redirectTo` and `emailRedirectTo` both use `VITE_APP_URL`
- `src/pages/AuthCallback.tsx`: waits for `SIGNED_IN` event instead of calling `getSession()` immediately; refreshes `avatar_url` from Google metadata on every sign-in
- `VITE_APP_URL` GitHub secret must have no trailing slash: `https://davideuantrott.github.io/meetup`
- Supabase Auth → URL Configuration → Site URL set to `https://davideuantrott.github.io/meetup/auth/callback` (ensures email confirmation links always land on the correct page)
- Supabase Auth → Redirect URLs allowlist includes `https://davideuantrott.github.io/meetup/auth/callback`
- `.github/workflows/deploy.yml`: copies `index.html` to `404.html` so GitHub Pages SPA routing works for deep links
- `src/hooks/useGroup.ts`: `createGroup` pre-generates UUID client-side so `group_members` is inserted before the `groups` SELECT — avoids RLS `is_group_member()` deadlock
- `src/hooks/useGroup.ts`: `fetchGroup` uses `.maybeSingle()` instead of `.single()` to avoid 406 when user has no group
- `src/hooks/useMeetup.ts`: `respond()` applies optimistic local state update before upsert; `fetchMeetup` skips `setLoading(true)` on background re-fetches using `initialLoadDone` ref
- `public/sw.js`: added `skipWaiting` + `clients.claim` so new service worker versions take over immediately on deploy

---

## What's not built yet (from the spec)

- OG image generation for WhatsApp preview cards (spec item 15)
- Nudge cron trigger wiring (the function exists; needs `pg_cron` or external scheduler)
- VAPID push signing in `send-notification` (currently falls back to email for all users)
- Customisable avatar colours in settings
- Multiple groups UI (data model supports it; UI assumes one group per user)
