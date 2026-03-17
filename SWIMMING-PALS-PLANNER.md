# Swimming Pals Planner — Build Specification

## Overview

A Progressive Web App for a small friend group (4–6 people) to coordinate one-off meetups. It replaces the inefficiency of pinning down a date in a WhatsApp group chat by providing a structured, fun, and personality-driven way to propose dates, collect availability, and confirm plans.

This is a personal tool for a specific group of friends. It should feel like it belongs to them, not like enterprise software or a SaaS product.

**Instance name:** Swimming Pals Planner
**Product name:** TBD (if it ever goes wider than this group)

---

## Tech Stack

- **Frontend:** React + TypeScript, built with Vite
- **Backend:** Supabase (auth, PostgreSQL database, real-time subscriptions, Edge Functions)
- **Hosting:** Vercel (frontend), Supabase (managed backend)
- **Email:** Resend (transactional emails — invites, confirmations, nudges)
- **PWA:** Workbox service worker for offline support, caching, and push notifications
- **Notifications:** Web Push API via service worker; Resend email as fallback

---

## Personality & Tone

The app has a voice: **dry and deadpan**. It acts like the driest person in the group — quietly judging everyone while being extremely helpful. It doesn't try too hard, doesn't use exclamation marks unless something genuinely unprecedented has happened, and treats the difficulty of getting friends together with resigned familiarity.

### Tone Principles

- Understated, never enthusiastic
- Observational rather than directive
- Acknowledges human behaviour without surprise
- All copy to be tailored by the product owner to suit the group's actual dynamics

### Placeholder Commentary (to be customised)

These are starting points — the product owner will write the final copy:

| State | Placeholder Copy |
|---|---|
| Everyone says yes | "Unprecedented. Mark the calendar. Actually, that's the whole point." |
| 4 yes, 1 no | "[Name] can't make it. The rest of you will have to cope somehow." |
| All maybes | "Commitment issues across the board. Shocking." |
| Nobody responded | "Tumbleweed." |
| One person responded | "[Name] has done their bit. The rest of you — noted." |
| Someone changes answer | "[Name] has revised their position. Diplomats call this a U-turn." |
| Someone marks maybe | "[Name] says maybe, which as we all know means no." |
| Meetup confirmed | "Done. [Date]. [Place]. No one's allowed to be ill." |
| Meetup cancelled | TBD — product owner to write |
| No clear winner | "No clear winner. You might need more options." |
| Date removed by creator | "[Name] has moved the goalposts." |

---

## Visual Identity

### Design Direction

- Clean, modern, mobile-first
- Should feel more like a game board than a calendar app
- Big tappable elements, generous spacing
- Personality comes through the copy, not visual busyness
- Colour palette and full design system will be provided via a JSONC file by the product owner using the frontend-designer skill

### Avatars

Each person is represented by a **single-letter initial in a coloured circle**. Clean and minimal.

**Avatar state overlays:**

| State | Visual Treatment |
|---|---|
| Responded yes | Subtle green ring around avatar |
| Responded maybe | Amber ring, slightly faded |
| Responded no | Greyed out with a tiny resigned face emoji overlay (😐, not sad) |
| Hasn't responded | Greyed out, clock icon, reduced opacity |
| Odd one out (only person who can't make the winning date) | Subtle rain cloud above avatar. No explanation. |

### Response Colour Coding

Bold and unambiguous — proper green / amber / red. No squinting on a phone screen.

- **Yes:** Green
- **Maybe:** Amber
- **No:** Red

---

## Authentication

- **Methods:** Google sign-in (primary, one-tap) and email + password (fallback)
- **Implementation:** Supabase Auth with Google OAuth provider and email/password
- **Session persistence:** Proper user accounts, remembered across sessions and devices
- **Pre-auth visibility:** None — users must sign in before seeing any content

---

## Group System

- **Creation:** First user signs up, creates a group, gives it a name
- **Invites:** Two methods:
  - Enter email addresses → invitees receive an email with a join link
  - Generate a shareable invite link → drop into WhatsApp
- **Joining:** Tapping an invite link leads to sign-in; after auth, user is automatically added to the group
- **MVP scope:** One group only, but the data model must support multiple groups for future expansion
- **Permissions:** All group members can create meetups; meetup-level permissions are scoped to the creator

---

## Data Model

```
users
├── id (uuid, PK, maps to Supabase auth.users)
├── name (text)
├── email (text)
├── avatar_colour (text)
├── created_at (timestamptz)

groups
├── id (uuid, PK)
├── name (text) — "Swimming Pals Planner" for this instance
├── created_by (uuid, FK → users)
├── invite_code (text, unique) — for shareable invite links
├── created_at (timestamptz)

group_members
├── group_id (uuid, FK → groups)
├── user_id (uuid, FK → users)
├── joined_at (timestamptz)
├── PRIMARY KEY (group_id, user_id)

meetups
├── id (uuid, PK)
├── group_id (uuid, FK → groups)
├── title (text)
├── location (text, nullable) — null means TBD
├── created_by (uuid, FK → users)
├── status (text) — 'open' | 'confirmed' | 'cancelled'
├── created_at (timestamptz)

proposed_slots
├── id (uuid, PK)
├── meetup_id (uuid, FK → meetups)
├── date (date)
├── time_type (text) — 'specific' | 'window' | 'none'
├── time_value (text, nullable) — "19:00" for specific, "evening" for window, null for none
├── created_at (timestamptz)

responses
├── id (uuid, PK)
├── slot_id (uuid, FK → proposed_slots)
├── user_id (uuid, FK → users)
├── availability (text) — 'yes' | 'maybe' | 'no'
├── updated_at (timestamptz)
├── UNIQUE (slot_id, user_id)

reactions
├── id (uuid, PK)
├── meetup_id (uuid, FK → meetups)
├── user_id (uuid, FK → users)
├── content (text) — pre-defined reaction string
├── created_at (timestamptz)

confirmed_details
├── meetup_id (uuid, FK → meetups, unique)
├── slot_id (uuid, FK → proposed_slots)
├── confirmed_at (timestamptz)
```

**Row-level security:** Users can only access data for groups they belong to. Enforce via Supabase RLS policies on all tables.

---

## User Flows

### Flow 1: First-Time Setup (Group Creator)

1. Open the app → sign up via Google or email/password
2. Create a group — give it a name
3. Invite members via email address or generate a shareable invite link
4. Arrive at the group home screen, ready to create meetups

### Flow 2: Invited User (First Time)

1. Tap invite link from WhatsApp or email
2. Land on sign-in screen — Google or email/password
3. After auth, automatically added to the group
4. See the group home screen and any active meetups

**Design goal:** Link tap to first interaction in under 30 seconds. Auth is the only gate. The invite link context must be preserved through the auth flow so group joining happens automatically.

### Flow 3: Returning User

1. Open PWA directly or tap a meetup link from WhatsApp
2. Already authenticated → straight to group home or the specific meetup

### Flow 4: Creating a Meetup

1. From the home screen, tap the create button
2. Enter a meetup name (e.g. "Curry night", "Pub garden if the weather holds")
3. Optionally add a location or leave as TBD
4. Add 3–5 date options — each with a required date and an optional time or time window
5. Publish the meetup — it appears on the group home screen for all members
6. Share to WhatsApp via the share button (generates a deep link to the specific meetup)

**Date/time flexibility:** A single meetup can mix specificity levels. Each date option has:
- Date (always required)
- Time type: specific time ("19:00"), window ("morning" / "afternoon" / "evening"), or none
- A card displays whatever level of detail was given

### Flow 5: Responding to a Meetup

1. Open the meetup (from home screen or WhatsApp link)
2. See the horizontal carousel of date cards
3. On each card, tap Yes / Maybe / No — three distinct buttons
4. See other people's responses update in real time
5. See the deadpan commentary update as responses come in
6. Optionally send a quick reaction

**Responses can be changed at any time** — the app acknowledges the change with commentary.

### Flow 6: Confirming a Meetup

Only the meetup creator can confirm.

1. The app highlights the best date based on responses
2. Creator taps to confirm the winning date
3. The meetup moves to "confirmed" state
4. All group members receive a notification (push or email)
5. The meetup view shows a countdown card and confirmation details

**No clear winner scenario:**
- Primary action: prompt the creator to add more date options
- Secondary action: allow the creator to force-confirm any date regardless

### Flow 7: Cancelling a Meetup

Only the meetup creator can cancel.

1. Creator taps cancel on a meetup
2. Cancellation triggers a notification to all group members
3. The meetup moves to archived/cancelled state

---

## Screen Specifications

### Screen 1: Sign-In

**Purpose:** Authenticate the user. The only gate before accessing the app.

**Elements:**
- Google sign-in button (prominent, primary action)
- Email/password form (secondary option)
- Minimal branding — app name and a single deadpan tagline

**Behaviour:**
- No sign-up/sign-in toggle — the email form handles both (check if account exists)
- If arriving via invite link, preserve that context through auth so group joining is automatic
- Error states: inline validation messages
- Loading: subtle spinner during auth

### Screen 2: Group Home

**Purpose:** The main hub. Shows active meetups and provides access to group management.

**Elements:**
- Group name at top
- Active meetups section — cards showing meetup name, status, response summary
- Archived meetups — collapsed/tucked away, accessible but not prominent
- Create meetup button (available to all group members)
- Group settings / invite members access

**Meetup card states:**
- Open: shows response progress (e.g. "3 of 5 responded")
- Confirmed: shows confirmed date with countdown
- Archived: muted/greyed cards

**Empty state:** Deadpan encouragement to create the first meetup.

**Architecture note:** Design for one group but the data model supports multiple groups. Don't paint into a corner.

### Screen 3: Create Meetup

**Purpose:** Set up a new meetup with name, optional location, and date options.

**Elements:**
- Meetup name input (placeholder in the deadpan voice)
- Location input (optional, "TBD" default)
- Date option rows — each has: date picker (required), optional time picker or window selector
- Add another date button (max 5)
- Remove date button on each row
- Publish button

**Date flexibility:**
- Time options: specific time, window (Morning / Afternoon / Evening), or no time
- A single meetup can mix specificity levels across date options
- Start with 3 date rows by default
- Minimum 2 date options required; name required

**Post-publish:** Redirect to the meetup view with a prompt to share to WhatsApp.

### Screen 4: Meetup View (Core Screen)

**Purpose:** Where people see proposed dates, respond, and watch the group converge. 90% of time in the app is spent here.

**Layout:**

**Top section:**
- Meetup name and location (or "TBD")
- Deadpan commentary line — updates live as responses come in
- Group avatar row — coloured initials with state overlays

**Middle section — horizontal scrolling date carousel:**
- Inspired by Calendly's horizontal scroll pattern
- Each date is a card with clear boundaries
- Card contents: date, time/window (if set), avatar indicators for respondents to this card (colour-coded by answer)
- Your own response: prominent Yes / Maybe / No buttons at the bottom of each card
- The "best date so far" card gets a subtle highlight/badge
- Cards are large enough for comfortable mobile tapping

**Bottom section:**
- Quick reactions bar

**Creator-specific elements:**
- Confirm button appears when there's a clear winner (or as secondary option when tied)
- Edit option to add/remove date options
- Cancel option

**Date removal:** When removing a date with existing responses, show confirmation: "2 people responded to this date. Remove anyway?"

**Real-time updates:** All responses, avatar states, commentary, and the best-date highlight update live via Supabase real-time subscriptions.

### Screen 5: Confirmed Meetup View

**Purpose:** The meetup is locked in. Shows confirmed details with a countdown.

**Elements:**
- Confirmed date and time displayed prominently
- Location (if set)
- List of who's coming (those who said yes to the confirmed date)
- The "odd one out" rain cloud treatment if someone couldn't make this date
- Countdown: days/hours until the meetup
- Confirmation commentary in the deadpan voice
- Share to WhatsApp button
- Cancel button (creator only)

**States:**
- Pre-event: countdown is active
- Day of: shows "Today" with appropriate copy
- Post-event: automatically moves to archived state

This replaces the active meetup view — the date cards are no longer needed.

### Screen 6: Quick Reactions

**Purpose:** Lightweight communication — not a full chat. Pre-written responses for common scenarios.

**Elements:**
- A bar of tappable reaction buttons at the bottom of the meetup view
- Reactions appear in a compact feed above the bar
- Each reaction shows sender's avatar and the message

**Default reactions:**
- "Works for me"
- "Can we do later?"
- "Can we do earlier?"
- "I'll sort it"
- "Running late (already)"

This is deliberately not a chat — the real conversation stays in WhatsApp.

---

## Notification System

### Channels

- **Push notifications:** Via Web Push API and service worker. Available to users who have installed the PWA.
- **Email fallback:** Via Resend. For users who haven't installed the PWA, or as backup.

### Triggers

- New meetup created in the group
- Someone responds to a meetup
- A meetup is confirmed
- A meetup is cancelled
- Nudge reminders for non-responders

### Nudge Escalation

Three nudges, then stop. The app gives up.

| Timing | Placeholder Copy |
|---|---|
| After 12 hours | "[Name] hasn't responded. They're probably busy. Probably." |
| After 24 hours | "[Name]. Mate. It's one button." |
| After 48 hours | "At this point [Name] is making a statement." |

**Implementation:** Supabase Edge Functions with cron-based triggers to check for non-responders and send nudges via push or email.

---

## WhatsApp Integration

### Sharing

- Share button on meetup creation and confirmed meetup screens
- Generates a deep link to the specific meetup
- Uses the Web Share API where available, with clipboard fallback

### Preview Card (Open Graph)

- **og:title:** Meetup name
- **og:description:** "Swimming Pals Planner"
- **og:image:** Dynamically generated card showing meetup details (dates, response status)
- Image generation via Vercel OG Image or Supabase Edge Function

---

## PWA Configuration

### Install Prompt

- **When:** After the user's first interaction (e.g. first time they respond to a meetup)
- **Style:** Simple dismissable banner with deadpan copy (e.g. "Install this. Push notifications are worth it.")
- **Frequency:** Show once. If dismissed, don't nag.

### Offline Behaviour

**What works offline (cached via service worker):**
- View confirmed meetup details (date, place, who's coming)
- View own past responses
- See the home screen with cached meetup cards

**Responding offline:**
- Responses are queued in local storage
- Synced automatically when connectivity returns
- Optimistic UI — the response appears immediately, syncs in background

**Service worker strategy:**
- Cache the app shell (HTML, CSS, JS) with a cache-first strategy
- Cache API responses with a stale-while-revalidate strategy
- Queue mutations (responses, reactions) with a background sync strategy

---

## Accessibility

### Baseline

**WCAG 2.1 AA compliance** — built in from the start, not retrofitted.

### Requirements

- **Contrast ratios:** All text meets AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- **Semantic HTML:** Proper heading hierarchy, landmark regions, form labels
- **ARIA:** Labels on interactive elements, live regions for real-time updates (commentary, response changes)
- **Tap targets:** Minimum 44px on all interactive elements
- **Focus management:** Logical focus order, visible focus indicators
- **Colour independence:** Yes/Maybe/No states use colour AND iconography/text — never colour alone
- **Form validation:** Error messages associated with fields via aria-describedby
- **Motion:** Respect prefers-reduced-motion for any animations (confetti on confirmation, card transitions)

---

## Meetup Editing Rules

- **Who can edit:** Only the meetup creator
- **What can be edited:** Add or remove date options after publishing
- **Removing dates with responses:** Show confirmation dialog with response count before removing
- **Responses to removed dates:** Discarded
- **Notifications:** Group is notified when dates are added or removed
- **Commentary:** Acknowledges the change in the deadpan voice

---

## Meetup Lifecycle

```
Created → Open (collecting responses) → Confirmed → Archived (after event date)
                                      → Cancelled → Archived
```

- **Open:** Accepting responses. Can be edited by creator. Can be confirmed or cancelled.
- **Confirmed:** Locked. No further responses or edits. Shows countdown. Automatically archives after the event date.
- **Cancelled:** Locked. Moves to archived state. Notification sent.
- **Archived:** Visible in the tucked-away archive section of the home screen. Read-only.

---

## Build Order

1. Supabase setup — schema, auth (Google + email/password), row-level security policies
2. Sign-in screen and auth flow (including invite link context preservation)
3. Group creation and invite system (email + shareable link)
4. Group home screen (with empty state)
5. Create meetup flow (with flexible date/time options)
6. Meetup view — date carousel, Yes/Maybe/No response buttons
7. Real-time updates via Supabase subscriptions and commentary engine
8. Avatar state system with overlays
9. Confirm / cancel flows
10. Confirmed meetup view with countdown
11. Quick reactions
12. Notifications — push via service worker + email via Resend
13. Nudge system — Edge Functions with cron triggers
14. Share to WhatsApp with deep linking
15. OG image generation for WhatsApp preview cards
16. PWA shell — service worker (Workbox), manifest, install prompt
17. Offline support — caching, response queueing, background sync
18. Archived meetups section
19. Accessibility audit and fixes
20. Polish — empty states, loading states, error states, personality copy refinement

---

## Out of Scope (MVP)

- Location voting
- Recurring meetups
- Calendar integration (Google/Apple)
- Calendar export (.ics)
- Full chat / messaging
- Multiple groups (data model supports it; UI doesn't)
- Customisable quick reactions
- Expense splitting
- Public/discoverable groups

---

## Notes for Implementation

- The product owner will provide a JSONC design system file for colours, typography, and spacing via the frontend-designer skill. Wait for this before making visual design decisions beyond the structural layout.
- All placeholder commentary copy is a starting point. The product owner will write the final copy to suit the group.
- The group name "Swimming Pals Planner" should be configurable in the group settings, not hardcoded.
- The architecture should treat the group name as the app name for that group — it appears in the PWA manifest, the header, and the WhatsApp preview.
