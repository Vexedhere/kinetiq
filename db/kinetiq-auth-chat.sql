-- Run this script in Supabase SQL Editor for the Kinetiq project.
-- This is separate from db/schema.sql, which describes the planned full platform schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(32) not null check (char_length(display_name) between 2 and 32),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_slug text not null check (char_length(channel_slug) between 1 and 80),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on public.chat_messages (channel_slug, created_at desc);

create table if not exists public.chat_roles (
  id uuid primary key default gen_random_uuid(),
  name varchar(32) not null check (char_length(name) between 2 and 32),
  color varchar(16) not null default 'purple',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (created_by, name)
);

create table if not exists public.chat_role_assignments (
  role_id uuid not null references public.chat_roles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_roles enable row level security;
alter table public.chat_role_assignments enable row level security;

drop policy if exists "Profiles are visible to signed-in members" on public.profiles;
create policy "Profiles are visible to signed-in members"
  on public.profiles for select to authenticated using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Signed-in members can read chat" on public.chat_messages;
create policy "Signed-in members can read chat"
  on public.chat_messages for select to authenticated using (true);
drop policy if exists "Members can post as themselves" on public.chat_messages;
create policy "Members can post as themselves"
  on public.chat_messages for insert to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "Signed-in members can read chat roles" on public.chat_roles;
create policy "Signed-in members can read chat roles"
  on public.chat_roles for select to authenticated using (true);
drop policy if exists "Members can create their own chat roles" on public.chat_roles;
create policy "Members can create their own chat roles"
  on public.chat_roles for insert to authenticated
  with check ((select auth.uid()) = created_by);
drop policy if exists "Role creators can update their roles" on public.chat_roles;
create policy "Role creators can update their roles"
  on public.chat_roles for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);
drop policy if exists "Role creators can delete their roles" on public.chat_roles;
create policy "Role creators can delete their roles"
  on public.chat_roles for delete to authenticated using ((select auth.uid()) = created_by);

drop policy if exists "Signed-in members can read role assignments" on public.chat_role_assignments;
create policy "Signed-in members can read role assignments"
  on public.chat_role_assignments for select to authenticated using (true);
drop policy if exists "Role creators can assign their roles" on public.chat_role_assignments;
create policy "Role creators can assign their roles"
  on public.chat_role_assignments for insert to authenticated
  with check (
    (select auth.uid()) = assigned_by
    and exists (
      select 1 from public.chat_roles r
      where r.id = role_id and r.created_by = (select auth.uid())
    )
  );
drop policy if exists "Role creators can remove their assignments" on public.chat_role_assignments;
create policy "Role creators can remove their assignments"
  on public.chat_role_assignments for delete to authenticated
  using (
    exists (
      select 1 from public.chat_roles r
      where r.id = role_id and r.created_by = (select auth.uid())
    )
  );

-- Enable Supabase Realtime for new chat messages. If this errors because the
-- table is already in the publication, leave the existing publication entry.
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
