-- Pack 2: MVP basic schema
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamp with time zone default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  name text not null,
  unique (club_id, name),
  created_at timestamp with time zone default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  match_date date not null,
  opponent text,
  venue text,
  competition text,
  created_at timestamp with time zone default now()
);

create table if not exists batting (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  runs int default 0,
  fours int default 0,
  sixes int default 0,
  fifty boolean default false,
  hundred boolean default false,
  mvp_points int default 0,
  created_at timestamp with time zone default now(),
  unique (match_id, player_id)
);

create table if not exists bowling (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  overs numeric(5,1) default 0,
  maidens int default 0,
  runs int default 0,
  wickets int default 0,
  five_wkts boolean default false,
  three_wkts boolean default false,
  mvp_points int default 0,
  created_at timestamp with time zone default now(),
  unique (match_id, player_id)
);

create table if not exists fielding (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  catches int default 0,
  stumpings int default 0,
  runouts int default 0,
  mvp_points int default 0,
  created_at timestamp with time zone default now(),
  unique (match_id, player_id)
);

-- Optional simple health table for connectivity checks
create table if not exists _health (
  id serial primary key,
  ok boolean default true,
  created_at timestamp with time zone default now()
);

-- RLS
alter table clubs enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table batting enable row level security;
alter table bowling enable row level security;
alter table fielding enable row level security;
alter table _health enable row level security;

-- Dev policies (permissive): allow anon read/write for now
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'clubs' and policyname = 'dev_all') then
    create policy dev_all on clubs for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'players' and policyname = 'dev_all') then
    create policy dev_all on players for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'matches' and policyname = 'dev_all') then
    create policy dev_all on matches for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'batting' and policyname = 'dev_all') then
    create policy dev_all on batting for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'bowling' and policyname = 'dev_all') then
    create policy dev_all on bowling for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'fielding' and policyname = 'dev_all') then
    create policy dev_all on fielding for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = '_health' and policyname = 'dev_all') then
    create policy dev_all on _health for all using (true) with check (true);
  end if;
end$$;
