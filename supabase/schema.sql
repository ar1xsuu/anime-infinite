-- ============================================================================
-- ANIME INFINITE — DATABASE SCHEMA
-- ============================================================================
-- Run this in the Supabase SQL Editor (or via `supabase db push`) on a fresh
-- project. Everything here is data-driven: no game content lives in code.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  is_admin boolean not null default false,
  level int not null default 1,
  xp bigint not null default 0,
  coins bigint not null default 1000,
  gems bigint not null default 100,
  pack_tickets int not null default 3,
  tower_floor int not null default 1,
  last_offline_collect_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CURRENCIES  (admin-configurable — display metadata for coins/gems/tickets/etc)
-- ----------------------------------------------------------------------------
create table public.currencies (
  id text primary key,              -- e.g. 'coins', 'gems', 'pack_tickets'
  name text not null,
  icon text,                        -- emoji or storage path
  is_premium boolean not null default false,
  active boolean not null default true
);

-- ----------------------------------------------------------------------------
-- RARITIES  (fully configurable — drop rates, caps, visuals)
-- ----------------------------------------------------------------------------
create table public.rarities (
  id text primary key,               -- 'N','R','SR','SSR','UR','LR','INFINITE'
  name text not null,
  sort_order int not null,
  color_hex text not null default '#888888',
  border_style text default 'solid', -- css hint used by frontend
  glow boolean not null default false,
  max_level int not null default 50,
  base_attack numeric not null default 10,
  base_hp numeric not null default 100,
  base_income numeric not null default 1,
  base_crit_rate numeric not null default 0.05,
  ascension_levels int not null default 3,        -- how many ascension tiers exist
  ascension_stat_multiplier numeric not null default 1.5, -- multiplier applied per ascension
  active boolean not null default true
);

-- ----------------------------------------------------------------------------
-- ABILITIES  (reusable ability definitions cards/mutations can reference)
-- ----------------------------------------------------------------------------
create table public.abilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  effect_type text not null,   -- e.g. 'income_multiplier','attack_flat','tower_damage_pct','team_buff'
  effect_value numeric not null default 0,
  active boolean not null default true
);

-- ----------------------------------------------------------------------------
-- MUTATIONS  (signature mechanic — fully admin-editable)
-- ----------------------------------------------------------------------------
create table public.mutations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  color_hex text default '#a855f7',
  rarity text references public.rarities(id),
  stat_modifiers jsonb not null default '{}'::jsonb, -- {"income_pct":20,"attack_pct":10}
  effects jsonb not null default '[]'::jsonb,        -- freeform list of special effect descriptors
  drop_chance numeric not null default 0.01,         -- chance when a card is eligible for mutation roll
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CHARACTERS  (master card definitions — the "template", not player-owned copies)
-- ----------------------------------------------------------------------------
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  character_name text not null,
  anime text not null,
  description text,
  image_url text,
  rarity text not null references public.rarities(id),
  base_attack numeric,        -- null = inherit from rarity
  base_hp numeric,
  base_income numeric,
  crit_rate numeric,
  level_cap int,              -- null = inherit from rarity.max_level
  tags text[] not null default '{}',           -- ['Shonen','Swordsman',...]
  mutation_slots int not null default 1,
  is_limited boolean not null default false,
  is_infinite boolean not null default false,
  limited_start timestamptz,
  limited_end timestamptz,
  release_date timestamptz not null default now(),
  active boolean not null default true,
  duplicated_from uuid references public.characters(id), -- set when created via "Duplicate"
  created_at timestamptz not null default now()
);

create table public.character_abilities (
  character_id uuid references public.characters(id) on delete cascade,
  ability_id uuid references public.abilities(id) on delete cascade,
  primary key (character_id, ability_id)
);

-- ----------------------------------------------------------------------------
-- PACKS
-- ----------------------------------------------------------------------------
create table public.packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  cost bigint not null default 0,
  currency_id text not null references public.currencies(id) default 'gems',
  min_rarity text references public.rarities(id),
  max_rarity text references public.rarities(id),
  is_limited boolean not null default false,
  start_at timestamptz,
  end_at timestamptz,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Which characters are pullable from a pack + their weight (must sum to 100 per pack)
create table public.pack_characters (
  pack_id uuid references public.packs(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  weight numeric not null default 1, -- relative drop weight within the pack
  primary key (pack_id, character_id)
);

-- ----------------------------------------------------------------------------
-- PLAYER-OWNED CARDS
-- ----------------------------------------------------------------------------
create table public.player_characters (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id),
  level int not null default 1,
  ascension_level int not null default 0,
  shards int not null default 0,
  duplicate_count int not null default 0,
  is_new boolean not null default true,
  obtained_at timestamptz not null default now(),
  unique (player_id, character_id)
);

create table public.character_mutations (
  id uuid primary key default gen_random_uuid(),
  player_character_id uuid not null references public.player_characters(id) on delete cascade,
  mutation_id uuid not null references public.mutations(id),
  applied_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TEAMS  (Phase 1: one active team of up to 5 slots, 3 used initially)
-- ----------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null unique references public.profiles(id) on delete cascade,
  max_slots int not null default 3,
  updated_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  slot int not null,
  player_character_id uuid references public.player_characters(id) on delete cascade,
  primary key (team_id, slot)
);

-- Team-wide bonuses from matching tags — fully data driven
create table public.team_bonus_rules (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  required_count int not null,
  effect_type text not null,  -- 'income_pct','attack_pct','tower_damage_pct'
  effect_value numeric not null,
  active boolean not null default true
);

-- ----------------------------------------------------------------------------
-- TOWER
-- ----------------------------------------------------------------------------
create table public.enemies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  hp bigint not null,
  attack bigint not null,
  active boolean not null default true
);

create table public.tower_floors (
  id uuid primary key default gen_random_uuid(),
  floor_number int not null unique,
  enemy_id uuid references public.enemies(id),
  required_power bigint not null default 0,
  coin_reward bigint not null default 0,
  gem_reward bigint not null default 0,
  pack_ticket_reward int not null default 0,
  first_clear_bonus_coins bigint not null default 0,
  first_clear_bonus_gems bigint not null default 0,
  is_boss boolean not null default false,
  active boolean not null default true
);

create table public.player_tower_progress (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  highest_floor_cleared int not null default 0,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MISSIONS
-- ----------------------------------------------------------------------------
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  mission_type text not null,   -- 'open_packs','upgrade_cards','clear_floors','collect_coins','ascend_card'
  target_count int not null default 1,
  reward_coins bigint not null default 0,
  reward_gems bigint not null default 0,
  reward_pack_tickets int not null default 0,
  is_daily boolean not null default true,
  active boolean not null default true
);

create table public.player_missions (
  player_id uuid references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  progress int not null default 0,
  completed boolean not null default false,
  claimed boolean not null default false,
  assigned_date date not null default current_date,
  primary key (player_id, mission_id, assigned_date)
);

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  banner_image_url text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  active boolean not null default true
);

create table public.event_characters (
  event_id uuid references public.events(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  primary key (event_id, character_id)
);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS  (audit log — every currency/card change funnels through here)
-- ----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,          -- 'pack_open','upgrade','ascend','tower_reward','offline_income','mission_reward','admin_grant'
  detail jsonb not null default '{}'::jsonb,
  coins_delta bigint not null default 0,
  gems_delta bigint not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CENTRALIZED BALANCING CONFIG  (section 31 — tune without code changes)
-- ----------------------------------------------------------------------------
create table public.game_config (
  key text primary key,
  value jsonb not null,
  description text
);

insert into public.game_config (key, value, description) values
  ('upgrade_cost', '{"base_cost": 100, "level_multiplier": 1.12}', 'cost = base_cost * level_multiplier^level'),
  ('ascension_cost', '{"base_shards": 5, "shard_multiplier": 1.5, "base_coins": 5000, "coin_multiplier": 1.6}', 'cost to ascend at a given ascension tier'),
  ('offline_income', '{"max_offline_hours": 8}', 'max hours of offline income that will be calculated'),
  ('xp_formula', '{"base_xp_to_level": 500, "level_multiplier": 1.15}', 'xp required = base_xp_to_level * level_multiplier^(level-1)'),
  ('duplicate_rewards', '{"shards_per_duplicate": 10, "coins_per_duplicate": 500}', 'reward given when pulling a card already owned'),
  ('mutation_roll', '{"base_chance_on_ascend": 0.1}', 'chance to roll a mutation slot when a card ascends');

-- ============================================================================
-- SEED: default currencies + rarities so the app is usable immediately
-- ============================================================================
insert into public.currencies (id, name, icon, is_premium) values
  ('coins', 'Coins', '🪙', false),
  ('gems', 'Gems', '💎', true),
  ('pack_tickets', 'Pack Tickets', '🎫', false);

insert into public.rarities (id, name, sort_order, color_hex, glow, max_level, base_attack, base_hp, base_income, base_crit_rate, ascension_levels, ascension_stat_multiplier) values
  ('N',        'Common',     1, '#9ca3af', false, 30,  10,   100,   1,    0.05, 2, 1.3),
  ('R',        'Rare',       2, '#60a5fa', false, 50,  25,   250,   3,    0.06, 2, 1.35),
  ('SR',       'Super Rare', 3, '#a78bfa', false, 70,  60,   600,   8,    0.08, 3, 1.4),
  ('SSR',      'Super Special Rare', 4, '#f59e0b', true, 90, 140,  1400,  20,   0.10, 3, 1.5),
  ('UR',       'Ultra Rare', 5, '#ef4444', true, 100, 300,  3000,  50,   0.13, 4, 1.6),
  ('LR',       'Legend Rare',6, '#facc15', true, 100, 600,  6000,  120,  0.16, 4, 1.75),
  ('INFINITE', 'Infinite',   7, '#22d3ee', true, 100, 1200, 12000, 300,  0.20, 5, 2.0);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.player_characters enable row level security;
alter table public.character_mutations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.player_tower_progress enable row level security;
alter table public.player_missions enable row level security;
alter table public.transactions enable row level security;

alter table public.currencies enable row level security;
alter table public.rarities enable row level security;
alter table public.abilities enable row level security;
alter table public.mutations enable row level security;
alter table public.characters enable row level security;
alter table public.character_abilities enable row level security;
alter table public.packs enable row level security;
alter table public.pack_characters enable row level security;
alter table public.team_bonus_rules enable row level security;
alter table public.enemies enable row level security;
alter table public.tower_floors enable row level security;
alter table public.missions enable row level security;
alter table public.events enable row level security;
alter table public.event_characters enable row level security;
alter table public.game_config enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql security definer stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Player data: owner can read/update their own row; admins can read/update all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "player_characters_own_or_admin" on public.player_characters
  for all using (auth.uid() = player_id or public.is_admin())
  with check (auth.uid() = player_id or public.is_admin());

create policy "character_mutations_own_or_admin" on public.character_mutations
  for all using (
    public.is_admin() or exists (
      select 1 from public.player_characters pc
      where pc.id = player_character_id and pc.player_id = auth.uid()
    )
  );

create policy "teams_own_or_admin" on public.teams
  for all using (auth.uid() = player_id or public.is_admin())
  with check (auth.uid() = player_id or public.is_admin());

create policy "team_members_own_or_admin" on public.team_members
  for all using (
    public.is_admin() or exists (select 1 from public.teams t where t.id = team_id and t.player_id = auth.uid())
  );

create policy "tower_progress_own_or_admin" on public.player_tower_progress
  for all using (auth.uid() = player_id or public.is_admin())
  with check (auth.uid() = player_id or public.is_admin());

create policy "player_missions_own_or_admin" on public.player_missions
  for all using (auth.uid() = player_id or public.is_admin())
  with check (auth.uid() = player_id or public.is_admin());

create policy "transactions_own_or_admin" on public.transactions
  for select using (auth.uid() = player_id or public.is_admin());

-- Game content: everyone can read active content; only admins can write
create policy "currencies_read" on public.currencies for select using (true);
create policy "currencies_write" on public.currencies for all using (public.is_admin()) with check (public.is_admin());

create policy "rarities_read" on public.rarities for select using (true);
create policy "rarities_write" on public.rarities for all using (public.is_admin()) with check (public.is_admin());

create policy "abilities_read" on public.abilities for select using (true);
create policy "abilities_write" on public.abilities for all using (public.is_admin()) with check (public.is_admin());

create policy "mutations_read" on public.mutations for select using (true);
create policy "mutations_write" on public.mutations for all using (public.is_admin()) with check (public.is_admin());

create policy "characters_read" on public.characters for select using (true);
create policy "characters_write" on public.characters for all using (public.is_admin()) with check (public.is_admin());

create policy "character_abilities_read" on public.character_abilities for select using (true);
create policy "character_abilities_write" on public.character_abilities for all using (public.is_admin()) with check (public.is_admin());

create policy "packs_read" on public.packs for select using (true);
create policy "packs_write" on public.packs for all using (public.is_admin()) with check (public.is_admin());

create policy "pack_characters_read" on public.pack_characters for select using (true);
create policy "pack_characters_write" on public.pack_characters for all using (public.is_admin()) with check (public.is_admin());

create policy "team_bonus_rules_read" on public.team_bonus_rules for select using (true);
create policy "team_bonus_rules_write" on public.team_bonus_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "enemies_read" on public.enemies for select using (true);
create policy "enemies_write" on public.enemies for all using (public.is_admin()) with check (public.is_admin());

create policy "tower_floors_read" on public.tower_floors for select using (true);
create policy "tower_floors_write" on public.tower_floors for all using (public.is_admin()) with check (public.is_admin());

create policy "missions_read" on public.missions for select using (true);
create policy "missions_write" on public.missions for all using (public.is_admin()) with check (public.is_admin());

create policy "events_read" on public.events for select using (true);
create policy "events_write" on public.events for all using (public.is_admin()) with check (public.is_admin());

create policy "event_characters_read" on public.event_characters for select using (true);
create policy "event_characters_write" on public.event_characters for all using (public.is_admin()) with check (public.is_admin());

create policy "game_config_read" on public.game_config for select using (true);
create policy "game_config_write" on public.game_config for all using (public.is_admin()) with check (public.is_admin());

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Player' || substr(new.id::text, 1, 6)));

  insert into public.teams (player_id) values (new.id);
  insert into public.player_tower_progress (player_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
