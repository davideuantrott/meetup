-- Swimming Pals Planner — Initial Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_colour text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid not null references public.users(id) on delete restrict,
  invite_code text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.meetups (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  location text,
  created_by uuid not null references public.users(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'confirmed', 'cancelled', 'archived')),
  created_at timestamptz not null default now()
);

create table public.proposed_slots (
  id uuid primary key default uuid_generate_v4(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  date date not null,
  time_type text not null default 'none' check (time_type in ('specific', 'window', 'none')),
  time_value text,
  created_at timestamptz not null default now()
);

create table public.responses (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references public.proposed_slots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  availability text not null check (availability in ('yes', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  unique (slot_id, user_id)
);

create table public.reactions (
  id uuid primary key default uuid_generate_v4(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.confirmed_details (
  meetup_id uuid primary key references public.meetups(id) on delete cascade,
  slot_id uuid not null references public.proposed_slots(id) on delete restrict,
  confirmed_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table public.nudge_log (
  id uuid primary key default uuid_generate_v4(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  nudge_number int not null check (nudge_number between 1 and 3),
  sent_at timestamptz not null default now(),
  unique (meetup_id, user_id, nudge_number)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.meetups enable row level security;
alter table public.proposed_slots enable row level security;
alter table public.responses enable row level security;
alter table public.reactions enable row level security;
alter table public.confirmed_details enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.nudge_log enable row level security;

-- Helper: is the current user a member of a given group?
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- users: anyone can read their own row; insert on signup; update own
create policy "users_select_own" on public.users for select using (id = auth.uid() or exists (
  select 1 from public.group_members gm1
  join public.group_members gm2 on gm1.group_id = gm2.group_id
  where gm1.user_id = auth.uid() and gm2.user_id = users.id
));
create policy "users_insert_own" on public.users for insert with check (id = auth.uid());
create policy "users_update_own" on public.users for update using (id = auth.uid());

-- groups: members can read; creator can update
create policy "groups_select_member" on public.groups for select using (public.is_group_member(id));
create policy "groups_insert_any_auth" on public.groups for insert with check (auth.uid() is not null);
create policy "groups_update_creator" on public.groups for update using (created_by = auth.uid());

-- group_members: members can read own group members; insert for joining
create policy "group_members_select" on public.group_members for select using (public.is_group_member(group_id));
create policy "group_members_insert" on public.group_members for insert with check (user_id = auth.uid() or exists (
  select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()
));
create policy "group_members_delete_self" on public.group_members for delete using (user_id = auth.uid());

-- meetups: group members can CRUD (creators can update/delete)
create policy "meetups_select" on public.meetups for select using (public.is_group_member(group_id));
create policy "meetups_insert" on public.meetups for insert with check (public.is_group_member(group_id) and created_by = auth.uid());
create policy "meetups_update_creator" on public.meetups for update using (created_by = auth.uid());
create policy "meetups_delete_creator" on public.meetups for delete using (created_by = auth.uid());

-- proposed_slots: via meetup membership
create policy "slots_select" on public.proposed_slots for select using (
  exists (select 1 from public.meetups m where m.id = meetup_id and public.is_group_member(m.group_id))
);
create policy "slots_insert" on public.proposed_slots for insert with check (
  exists (select 1 from public.meetups m where m.id = meetup_id and m.created_by = auth.uid())
);
create policy "slots_delete" on public.proposed_slots for delete using (
  exists (select 1 from public.meetups m where m.id = meetup_id and m.created_by = auth.uid())
);

-- responses: group members can respond
create policy "responses_select" on public.responses for select using (
  exists (
    select 1 from public.proposed_slots ps
    join public.meetups m on m.id = ps.meetup_id
    where ps.id = slot_id and public.is_group_member(m.group_id)
  )
);
create policy "responses_insert" on public.responses for insert with check (user_id = auth.uid() and
  exists (
    select 1 from public.proposed_slots ps
    join public.meetups m on m.id = ps.meetup_id
    where ps.id = slot_id and public.is_group_member(m.group_id)
  )
);
create policy "responses_update_own" on public.responses for update using (user_id = auth.uid());
create policy "responses_delete_own" on public.responses for delete using (user_id = auth.uid());

-- reactions: group members
create policy "reactions_select" on public.reactions for select using (
  exists (select 1 from public.meetups m where m.id = meetup_id and public.is_group_member(m.group_id))
);
create policy "reactions_insert" on public.reactions for insert with check (user_id = auth.uid() and
  exists (select 1 from public.meetups m where m.id = meetup_id and public.is_group_member(m.group_id))
);

-- confirmed_details
create policy "confirmed_select" on public.confirmed_details for select using (
  exists (select 1 from public.meetups m where m.id = meetup_id and public.is_group_member(m.group_id))
);
create policy "confirmed_insert" on public.confirmed_details for insert with check (
  exists (select 1 from public.meetups m where m.id = meetup_id and m.created_by = auth.uid())
);

-- push_subscriptions: own
create policy "push_select_own" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push_insert_own" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_delete_own" on public.push_subscriptions for delete using (user_id = auth.uid());

-- nudge_log: service role only (edge functions)
-- No user-facing policies needed; queries via service role key

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.group_members (user_id);
create index on public.meetups (group_id, status);
create index on public.proposed_slots (meetup_id);
create index on public.responses (slot_id);
create index on public.responses (user_id);
create index on public.reactions (meetup_id);
create index on public.nudge_log (meetup_id, user_id);

-- ============================================================
-- AUTO-ARCHIVE FUNCTION (called by edge function / cron)
-- ============================================================
create or replace function public.archive_past_meetups()
returns void
language plpgsql
security definer
as $$
begin
  update public.meetups m
  set status = 'archived'
  from public.confirmed_details cd
  join public.proposed_slots ps on ps.id = cd.slot_id
  where cd.meetup_id = m.id
    and ps.date < current_date
    and m.status = 'confirmed';
end;
$$;
