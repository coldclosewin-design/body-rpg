-- Body RPG 초기 스키마. Supabase SQL Editor 에 통째로 붙여넣어 실행하세요.
create extension if not exists "pgcrypto";

-- 프로필 (auth.users 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  invite_code text unique not null default encode(gen_random_bytes(4), 'hex'),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default '⭐',
  color text not null default '#4cc9f0',
  base_job_name text not null default '견습생',
  tiers jsonb not null default '[]',
  "order" int not null default 0
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active','mastered','paused')),
  goal jsonb not null,
  mastered_at timestamptz,
  "order" int not null default 0
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  name text not null,
  metric text not null check (metric in ('count','minutes','check')),
  target numeric not null default 1,
  cadence jsonb not null default '{"per":"week","times":3}',
  xp int not null default 10,
  "order" int not null default 0
);

create table if not exists public.task_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  date date not null,
  value numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists task_logs_user_date on public.task_logs(user_id, date);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  tiers jsonb not null default '[]'
);

create table if not exists public.characters (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  name text not null default '나',
  appearance jsonb not null default '{}',
  equipped_title text,
  equipped_outfit text,
  equipped_accessory text,
  unlocked jsonb not null default '[]',
  settings jsonb not null default '{"weekStartsOn":1}'
);

-- 지인 연결 (초대코드로 연결, 양방향 읽기)
create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- 가입 시 프로필/캐릭터 자동 생성
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.characters (user_id) values (new.id);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 초대코드로 친구 추가 (양방향 row 생성)
create or replace function public.add_friend_by_code(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select id into fid from public.profiles where invite_code = code;
  if fid is null or fid = auth.uid() then raise exception 'invalid invite code'; end if;
  insert into public.friendships (user_id, friend_id) values (auth.uid(), fid) on conflict do nothing;
  insert into public.friendships (user_id, friend_id) values (fid, auth.uid()) on conflict do nothing;
  return fid;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.domains enable row level security;
alter table public.skills enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;
alter table public.seasons enable row level security;
alter table public.characters enable row level security;
alter table public.friendships enable row level security;

create or replace function public.is_friend(owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships where user_id = auth.uid() and friend_id = owner);
$$;

-- profiles: 본인 전체, 친구 읽기
create policy "profiles self" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles friend read" on public.profiles for select using (public.is_friend(id));

-- 소유 테이블: 본인 전체 + 친구 읽기
do $$ declare t text;
begin
  foreach t in array array['domains','skills','tasks','task_logs','seasons','characters'] loop
    execute format('create policy "%s self" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('create policy "%s friend read" on public.%I for select using (public.is_friend(user_id))', t, t);
  end loop;
end $$;

create policy "friendships self" on public.friendships for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friendships delete" on public.friendships for delete using (user_id = auth.uid());
