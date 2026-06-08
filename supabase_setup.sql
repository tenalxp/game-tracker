-- Game Daily Tracker - Supabase Setup
-- รัน SQL นี้ใน Supabase SQL Editor

create table if not exists games (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

create table if not exists game_accounts (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists game_tasks (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references games(id) on delete cascade not null,
  name text not null,
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists task_completions (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references game_accounts(id) on delete cascade not null,
  task_id uuid references game_tasks(id) on delete cascade not null,
  game_day date not null,
  completed_at timestamptz default now(),
  unique(account_id, task_id, game_day)
);

-- Enable Row Level Security (public access - same as payment tracker)
alter table games enable row level security;
alter table game_accounts enable row level security;
alter table game_tasks enable row level security;
alter table task_completions enable row level security;

create policy "public_all" on games for all using (true) with check (true);
create policy "public_all" on game_accounts for all using (true) with check (true);
create policy "public_all" on game_tasks for all using (true) with check (true);
create policy "public_all" on task_completions for all using (true) with check (true);
