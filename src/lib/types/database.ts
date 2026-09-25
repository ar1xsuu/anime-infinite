/**
 * Hand-written types mirroring supabase/schema.sql.
 *
 * Once your Supabase project is live, you can replace this whole file with
 * generated types for perfect accuracy:
 *
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/types/database.ts
 *
 * Until then, this file is kept intentionally close to the SQL so the two
 * don't drift far apart.
 */

export type Rarity = {
  id: string;
  name: string;
  sort_order: number;
  color_hex: string;
  border_style: string | null;
  glow: boolean;
  max_level: number;
  base_attack: number;
  base_hp: number;
  base_income: number;
  base_crit_rate: number;
  ascension_levels: number;
  ascension_stat_multiplier: number;
  active: boolean;
};

export type CharacterRow = {
  id: string;
  character_name: string;
  anime: string;
  description: string | null;
  image_url: string | null;
  rarity: string;
  base_attack: number | null;
  base_hp: number | null;
  base_income: number | null;
  crit_rate: number | null;
  level_cap: number | null;
  tags: string[];
  mutation_slots: number;
  is_limited: boolean;
  is_infinite: boolean;
  limited_start: string | null;
  limited_end: string | null;
  release_date: string;
  active: boolean;
  duplicated_from: string | null;
  created_at: string;
};

export type PackRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  cost: number;
  currency_id: string;
  min_rarity: string | null;
  max_rarity: string | null;
  is_limited: boolean;
  start_at: string | null;
  end_at: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type PackCharacterRow = {
  pack_id: string;
  character_id: string;
  weight: number;
};

export type MutationRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color_hex: string | null;
  rarity: string | null;
  stat_modifiers: Record<string, number>;
  effects: unknown[];
  drop_chance: number;
  active: boolean;
  created_at: string;
};

export type PlayerCharacterRow = {
  id: string;
  player_id: string;
  character_id: string;
  level: number;
  ascension_level: number;
  shards: number;
  duplicate_count: number;
  is_new: boolean;
  obtained_at: string;
};

export type ProfileRow = {
  id: string;
  username: string;
  is_admin: boolean;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  pack_tickets: number;
  tower_floor: number;
  last_offline_collect_at: string;
  created_at: string;
  last_login_at: string;
};

export type TowerFloorRow = {
  id: string;
  floor_number: number;
  enemy_id: string | null;
  required_power: number;
  coin_reward: number;
  gem_reward: number;
  pack_ticket_reward: number;
  first_clear_bonus_coins: number;
  first_clear_bonus_gems: number;
  is_boss: boolean;
  active: boolean;
};

export type EnemyRow = {
  id: string;
  name: string;
  image_url: string | null;
  hp: number;
  attack: number;
  active: boolean;
};

export type MissionRow = {
  id: string;
  name: string;
  description: string | null;
  mission_type: string;
  target_count: number;
  reward_coins: number;
  reward_gems: number;
  reward_pack_tickets: number;
  is_daily: boolean;
  active: boolean;
};

export type PlayerMissionRow = {
  player_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  assigned_date: string;
};

export type EventRow = {
  id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  start_at: string;
  end_at: string;
  active: boolean;
};

export type CurrencyRow = {
  id: string;
  name: string;
  icon: string | null;
  is_premium: boolean;
  active: boolean;
};

export type AbilityRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  effect_type: string;
  effect_value: number;
  active: boolean;
};

export type TeamRow = {
  id: string;
  player_id: string;
  max_slots: number;
  updated_at: string;
};

export type TeamMemberRow = {
  team_id: string;
  slot: number;
  player_character_id: string;
};

// Minimal `Database` shape so `@supabase/ssr` generics are satisfied.
// Table-level typing is done ad-hoc at each call site via the row types above.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
