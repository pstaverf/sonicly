create extension if not exists "pgcrypto";

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id text not null,
  track jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);

create table if not exists public.playlists (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  track_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists likes_user_id_idx on public.likes (user_id);
create index if not exists playlists_user_id_idx on public.playlists (user_id);

alter table public.likes enable row level security;
alter table public.playlists enable row level security;

create policy "likes_select_own"
  on public.likes
  for select
  using (auth.uid() = user_id);

create policy "likes_insert_own"
  on public.likes
  for insert
  with check (auth.uid() = user_id);

create policy "likes_update_own"
  on public.likes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes
  for delete
  using (auth.uid() = user_id);

create policy "playlists_select_own"
  on public.playlists
  for select
  using (auth.uid() = user_id);

create policy "playlists_insert_own"
  on public.playlists
  for insert
  with check (auth.uid() = user_id);

create policy "playlists_update_own"
  on public.playlists
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "playlists_delete_own"
  on public.playlists
  for delete
  using (auth.uid() = user_id);
