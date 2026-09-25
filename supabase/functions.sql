-- ============================================================================
-- ANIME INFINITE — GAME LOGIC (Postgres RPC functions)
-- ============================================================================
-- Run this AFTER schema.sql. Every gameplay action that changes currency or
-- cards happens here, server-side, as SECURITY DEFINER functions — the
-- client can only ever ask "open this pack for me", never "give me an SSR".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: read a game_config value
-- ----------------------------------------------------------------------------
create or replace function public._config(cfg_key text)
returns jsonb language sql stable as $$
  select value from public.game_config where key = cfg_key;
$$;

-- ----------------------------------------------------------------------------
-- OPEN PACK
-- ----------------------------------------------------------------------------
create or replace function public.open_pack(p_pack_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_pack public.packs%rowtype;
  v_total_weight numeric;
  v_roll numeric;
  v_running numeric := 0;
  v_char public.characters%rowtype;
  v_pc public.player_characters%rowtype;
  v_is_new boolean := false;
  v_dup_cfg jsonb := public._config('duplicate_rewards');
  v_result jsonb;
begin
  select * into v_pack from public.packs where id = p_pack_id and active = true
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now());
  if not found then
    raise exception 'Pack not available';
  end if;

  -- charge the player
  if v_pack.currency_id = 'coins' then
    update public.profiles set coins = coins - v_pack.cost
      where id = v_player and coins >= v_pack.cost
      returning coins into v_running; -- reuse var, just need "found" check
    if not found then raise exception 'Not enough coins'; end if;
  elsif v_pack.currency_id = 'gems' then
    update public.profiles set gems = gems - v_pack.cost
      where id = v_player and gems >= v_pack.cost
      returning gems into v_running;
    if not found then raise exception 'Not enough gems'; end if;
  else
    update public.profiles set pack_tickets = pack_tickets - v_pack.cost
      where id = v_player and pack_tickets >= v_pack.cost
      returning pack_tickets into v_running;
    if not found then raise exception 'Not enough pack tickets'; end if;
  end if;
  v_running := 0;

  -- weighted random pick among this pack's active, in-window characters
  select coalesce(sum(pc.weight), 0) into v_total_weight
  from public.pack_characters pc
  join public.characters c on c.id = pc.character_id
  where pc.pack_id = p_pack_id and c.active = true
    and (c.is_limited = false or (now() between c.limited_start and c.limited_end));

  if v_total_weight <= 0 then
    raise exception 'Pack has no available cards';
  end if;

  v_roll := random() * v_total_weight;

  -- weighted pick via running-sum window function over this pack's eligible cards
  select c.* into v_char from (
    select c.*, sum(pc.weight) over (order by c.id) as running_weight
    from public.pack_characters pc
    join public.characters c on c.id = pc.character_id
    where pc.pack_id = p_pack_id and c.active = true
      and (c.is_limited = false or (now() between c.limited_start and c.limited_end))
  ) c
  where c.running_weight >= v_roll
  order by c.id
  limit 1;

  -- grant / upgrade player_characters row
  select * into v_pc from public.player_characters where player_id = v_player and character_id = v_char.id;

  if not found then
    v_is_new := true;
    insert into public.player_characters (player_id, character_id)
    values (v_player, v_char.id)
    returning * into v_pc;
  else
    update public.player_characters
      set duplicate_count = duplicate_count + 1,
          shards = shards + coalesce((v_dup_cfg->>'shards_per_duplicate')::int, 10)
      where id = v_pc.id
      returning * into v_pc;
    update public.profiles set coins = coins + coalesce((v_dup_cfg->>'coins_per_duplicate')::bigint, 500)
      where id = v_player;
  end if;

  insert into public.transactions (player_id, type, detail)
  values (v_player, 'pack_open', jsonb_build_object('pack_id', p_pack_id, 'character_id', v_char.id, 'is_new', v_is_new));

  v_result := jsonb_build_object(
    'character_id', v_char.id,
    'character_name', v_char.character_name,
    'anime', v_char.anime,
    'rarity', v_char.rarity,
    'image_url', v_char.image_url,
    'is_new', v_is_new,
    'player_character_id', v_pc.id
  );
  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- Compute a player_character's current effective stats (base + level + ascension + mutations)
-- ----------------------------------------------------------------------------
create or replace function public.get_card_power(p_player_character_id uuid)
returns jsonb
language plpgsql stable
as $$
declare
  v_pc public.player_characters%rowtype;
  v_char public.characters%rowtype;
  v_rar public.rarities%rowtype;
  v_attack numeric; v_hp numeric; v_income numeric; v_crit numeric;
  v_asc_mult numeric;
  v_mut record;
  v_income_pct numeric := 0; v_attack_pct numeric := 0; v_tower_pct numeric := 0;
begin
  select * into v_pc from public.player_characters where id = p_player_character_id;
  select * into v_char from public.characters where id = v_pc.character_id;
  select * into v_rar from public.rarities where id = v_char.rarity;

  v_attack := coalesce(v_char.base_attack, v_rar.base_attack) * (1 + (v_pc.level - 1) * 0.06);
  v_hp     := coalesce(v_char.base_hp, v_rar.base_hp)         * (1 + (v_pc.level - 1) * 0.06);
  v_income := coalesce(v_char.base_income, v_rar.base_income) * (1 + (v_pc.level - 1) * 0.08);
  v_crit   := coalesce(v_char.crit_rate, v_rar.base_crit_rate);

  v_asc_mult := power(v_rar.ascension_stat_multiplier, v_pc.ascension_level);
  v_attack := v_attack * v_asc_mult;
  v_hp := v_hp * v_asc_mult;
  v_income := v_income * v_asc_mult;

  for v_mut in
    select m.stat_modifiers from public.character_mutations cm
    join public.mutations m on m.id = cm.mutation_id
    where cm.player_character_id = p_player_character_id
  loop
    v_income_pct := v_income_pct + coalesce((v_mut.stat_modifiers->>'income_pct')::numeric, 0);
    v_attack_pct := v_attack_pct + coalesce((v_mut.stat_modifiers->>'attack_pct')::numeric, 0);
    v_tower_pct  := v_tower_pct  + coalesce((v_mut.stat_modifiers->>'tower_damage_pct')::numeric, 0);
  end loop;

  v_attack := v_attack * (1 + v_attack_pct / 100.0);
  v_income := v_income * (1 + v_income_pct / 100.0);

  return jsonb_build_object(
    'attack', round(v_attack), 'hp', round(v_hp), 'income', round(v_income, 2),
    'crit_rate', v_crit, 'tower_damage_pct_bonus', v_tower_pct
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- UPGRADE CARD  (cost = base_cost * level_multiplier^level, from game_config)
-- ----------------------------------------------------------------------------
create or replace function public.upgrade_card(p_player_character_id uuid, p_levels int default 1)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_pc public.player_characters%rowtype;
  v_char public.characters%rowtype;
  v_rar public.rarities%rowtype;
  v_cfg jsonb := public._config('upgrade_cost');
  v_base numeric := coalesce((v_cfg->>'base_cost')::numeric, 100);
  v_mult numeric := coalesce((v_cfg->>'level_multiplier')::numeric, 1.12);
  v_total_cost bigint := 0;
  v_cap int;
  i int;
begin
  select * into v_pc from public.player_characters where id = p_player_character_id and player_id = v_player;
  if not found then raise exception 'Card not found'; end if;

  select * into v_char from public.characters where id = v_pc.character_id;
  select * into v_rar from public.rarities where id = v_char.rarity;
  v_cap := coalesce(v_char.level_cap, v_rar.max_level);

  if v_pc.level + p_levels > v_cap then
    raise exception 'Would exceed level cap of % — ascend first', v_cap;
  end if;

  for i in 0..(p_levels - 1) loop
    v_total_cost := v_total_cost + floor(v_base * power(v_mult, v_pc.level + i));
  end loop;

  update public.profiles set coins = coins - v_total_cost
    where id = v_player and coins >= v_total_cost;
  if not found then raise exception 'Not enough coins (need %)', v_total_cost; end if;

  update public.player_characters set level = level + p_levels where id = p_player_character_id;

  insert into public.transactions (player_id, type, detail, coins_delta)
  values (v_player, 'upgrade', jsonb_build_object('player_character_id', p_player_character_id, 'levels', p_levels), -v_total_cost);

  return jsonb_build_object('new_level', v_pc.level + p_levels, 'coins_spent', v_total_cost);
end;
$$;

-- ----------------------------------------------------------------------------
-- ASCEND CARD  (must be at level cap; resets level to 1, +ascension tier)
-- ----------------------------------------------------------------------------
create or replace function public.ascend_card(p_player_character_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_pc public.player_characters%rowtype;
  v_char public.characters%rowtype;
  v_rar public.rarities%rowtype;
  v_cfg jsonb := public._config('ascension_cost');
  v_base_shards numeric := coalesce((v_cfg->>'base_shards')::numeric, 5);
  v_shard_mult numeric := coalesce((v_cfg->>'shard_multiplier')::numeric, 1.5);
  v_base_coins numeric := coalesce((v_cfg->>'base_coins')::numeric, 5000);
  v_coin_mult numeric := coalesce((v_cfg->>'coin_multiplier')::numeric, 1.6);
  v_shard_cost int;
  v_coin_cost bigint;
  v_mut_cfg jsonb := public._config('mutation_roll');
  v_rolled_mutation uuid := null;
begin
  select * into v_pc from public.player_characters where id = p_player_character_id and player_id = v_player;
  if not found then raise exception 'Card not found'; end if;

  select * into v_char from public.characters where id = v_pc.character_id;
  select * into v_rar from public.rarities where id = v_char.rarity;
  if v_pc.level < coalesce(v_char.level_cap, v_rar.max_level) then
    raise exception 'Card must reach level % before ascending', coalesce(v_char.level_cap, v_rar.max_level);
  end if;
  if v_pc.ascension_level >= v_rar.ascension_levels then
    raise exception 'Card is already at maximum ascension';
  end if;

  v_shard_cost := ceil(v_base_shards * power(v_shard_mult, v_pc.ascension_level));
  v_coin_cost := floor(v_base_coins * power(v_coin_mult, v_pc.ascension_level));

  if v_pc.shards < v_shard_cost then
    raise exception 'Need % shards (have %)', v_shard_cost, v_pc.shards;
  end if;

  update public.profiles set coins = coins - v_coin_cost where id = v_player and coins >= v_coin_cost;
  if not found then raise exception 'Not enough coins (need %)', v_coin_cost; end if;

  update public.player_characters
    set ascension_level = ascension_level + 1, level = 1, shards = shards - v_shard_cost
    where id = p_player_character_id;

  -- chance to roll a new mutation slot on ascension, if the card has free slots
  if random() < coalesce((v_mut_cfg->>'base_chance_on_ascend')::numeric, 0.1)
     and (select count(*) from public.character_mutations where player_character_id = p_player_character_id) < v_char.mutation_slots
  then
    select id into v_rolled_mutation from public.mutations where active = true order by random() limit 1;
    if v_rolled_mutation is not null then
      insert into public.character_mutations (player_character_id, mutation_id)
      values (p_player_character_id, v_rolled_mutation);
    end if;
  end if;

  insert into public.transactions (player_id, type, detail, coins_delta)
  values (v_player, 'ascend', jsonb_build_object('player_character_id', p_player_character_id, 'mutation_rolled', v_rolled_mutation), -v_coin_cost);

  return jsonb_build_object('new_ascension_level', v_pc.ascension_level + 1, 'mutation_rolled', v_rolled_mutation);
end;
$$;

-- ----------------------------------------------------------------------------
-- ASSIGN TEAM  (replace all slots atomically)
-- ----------------------------------------------------------------------------
create or replace function public.assign_team(p_player_character_ids uuid[])
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_team public.teams%rowtype;
  v_id uuid;
  v_slot int := 0;
  v_count int;
begin
  select * into v_team from public.teams where player_id = v_player;
  if not found then raise exception 'No team row for player'; end if;

  select count(*) into v_count from public.player_characters
    where id = any(p_player_character_ids) and player_id = v_player;
  if v_count <> array_length(p_player_character_ids, 1) then
    raise exception 'One or more cards are not owned by you';
  end if;
  if array_length(p_player_character_ids, 1) > v_team.max_slots then
    raise exception 'Team only has % slots', v_team.max_slots;
  end if;

  delete from public.team_members where team_id = v_team.id;
  foreach v_id in array p_player_character_ids loop
    insert into public.team_members (team_id, slot, player_character_id) values (v_team.id, v_slot, v_id);
    v_slot := v_slot + 1;
  end loop;
  update public.teams set updated_at = now() where id = v_team.id;

  return jsonb_build_object('slots_filled', v_slot);
end;
$$;

-- ----------------------------------------------------------------------------
-- Compute total team power + income for a player (used by frontend + fight_floor)
-- ----------------------------------------------------------------------------
create or replace function public.get_team_power(p_player_id uuid)
returns jsonb
language plpgsql stable
as $$
declare
  v_team_id uuid;
  v_attack numeric := 0; v_hp numeric := 0; v_income numeric := 0; v_tower_pct numeric := 0;
  v_member record;
  v_power jsonb;
  v_tag_counts jsonb := '{}'::jsonb;
  v_rule record;
  v_bonus_income_pct numeric := 0; v_bonus_attack_pct numeric := 0; v_bonus_tower_pct numeric := 0;
  v_tag text;
begin
  select id into v_team_id from public.teams where player_id = p_player_id;

  for v_member in
    select tm.player_character_id, c.tags from public.team_members tm
    join public.player_characters pc on pc.id = tm.player_character_id
    join public.characters c on c.id = pc.character_id
    where tm.team_id = v_team_id
  loop
    v_power := public.get_card_power(v_member.player_character_id);
    v_attack := v_attack + (v_power->>'attack')::numeric;
    v_hp := v_hp + (v_power->>'hp')::numeric;
    v_income := v_income + (v_power->>'income')::numeric;
    v_tower_pct := v_tower_pct + (v_power->>'tower_damage_pct_bonus')::numeric;

    foreach v_tag in array v_member.tags loop
      v_tag_counts := jsonb_set(v_tag_counts, array[v_tag], to_jsonb(coalesce((v_tag_counts->>v_tag)::int, 0) + 1));
    end loop;
  end loop;

  for v_rule in select * from public.team_bonus_rules where active = true loop
    if coalesce((v_tag_counts->>v_rule.tag)::int, 0) >= v_rule.required_count then
      if v_rule.effect_type = 'income_pct' then v_bonus_income_pct := v_bonus_income_pct + v_rule.effect_value;
      elsif v_rule.effect_type = 'attack_pct' then v_bonus_attack_pct := v_bonus_attack_pct + v_rule.effect_value;
      elsif v_rule.effect_type = 'tower_damage_pct' then v_bonus_tower_pct := v_bonus_tower_pct + v_rule.effect_value;
      end if;
    end if;
  end loop;

  v_attack := v_attack * (1 + v_bonus_attack_pct / 100.0);
  v_income := v_income * (1 + v_bonus_income_pct / 100.0);

  return jsonb_build_object(
    'attack', round(v_attack), 'hp', round(v_hp), 'income_per_sec', round(v_income, 2),
    'tower_damage_pct_bonus', v_tower_pct + v_bonus_tower_pct,
    'power', round(v_attack + v_hp * 0.1)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- FIGHT TOWER FLOOR
-- ----------------------------------------------------------------------------
create or replace function public.fight_floor(p_floor_number int)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_floor public.tower_floors%rowtype;
  v_progress public.player_tower_progress%rowtype;
  v_team jsonb;
  v_enemy_power numeric;
  v_win boolean;
  v_is_first_clear boolean;
  v_coins bigint; v_gems bigint; v_tickets int;
begin
  select * into v_progress from public.player_tower_progress where player_id = v_player;
  if p_floor_number > v_progress.highest_floor_cleared + 1 then
    raise exception 'You must clear earlier floors first';
  end if;

  select * into v_floor from public.tower_floors where floor_number = p_floor_number and active = true;
  if not found then raise exception 'Floor not found'; end if;

  select coalesce(e.attack,0) + coalesce(e.hp,0) * 0.1 into v_enemy_power
  from public.enemies e where e.id = v_floor.enemy_id;

  v_team := public.get_team_power(v_player);
  v_win := (v_team->>'power')::numeric >= greatest(v_enemy_power, v_floor.required_power);

  v_is_first_clear := p_floor_number > v_progress.highest_floor_cleared;

  if v_win then
    v_coins := v_floor.coin_reward + (case when v_is_first_clear then v_floor.first_clear_bonus_coins else 0 end);
    v_gems := v_floor.gem_reward + (case when v_is_first_clear then v_floor.first_clear_bonus_gems else 0 end);
    v_tickets := v_floor.pack_ticket_reward;

    update public.profiles set coins = coins + v_coins, gems = gems + v_gems, pack_tickets = pack_tickets + v_tickets
      where id = v_player;

    if v_is_first_clear then
      update public.player_tower_progress set highest_floor_cleared = p_floor_number, updated_at = now()
        where player_id = v_player;
      update public.profiles set tower_floor = p_floor_number + 1 where id = v_player;
    end if;

    insert into public.transactions (player_id, type, detail, coins_delta, gems_delta)
    values (v_player, 'tower_reward', jsonb_build_object('floor', p_floor_number, 'first_clear', v_is_first_clear), v_coins, v_gems);
  end if;

  return jsonb_build_object(
    'win', v_win, 'your_power', v_team->'power', 'enemy_power', round(v_enemy_power),
    'coins_awarded', coalesce(v_coins,0), 'gems_awarded', coalesce(v_gems,0),
    'pack_tickets_awarded', coalesce(v_tickets,0), 'first_clear', v_is_first_clear
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- CLAIM OFFLINE INCOME
-- ----------------------------------------------------------------------------
create or replace function public.claim_offline_income()
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_team jsonb;
  v_cfg jsonb := public._config('offline_income');
  v_max_hours numeric := coalesce((v_cfg->>'max_offline_hours')::numeric, 8);
  v_seconds numeric;
  v_coins bigint;
begin
  select * into v_profile from public.profiles where id = v_player;
  v_seconds := least(extract(epoch from (now() - v_profile.last_offline_collect_at)), v_max_hours * 3600);
  v_team := public.get_team_power(v_player);
  v_coins := floor((v_team->>'income_per_sec')::numeric * v_seconds);

  update public.profiles set coins = coins + v_coins, last_offline_collect_at = now() where id = v_player;

  insert into public.transactions (player_id, type, detail, coins_delta)
  values (v_player, 'offline_income', jsonb_build_object('seconds', v_seconds), v_coins);

  return jsonb_build_object('coins_awarded', v_coins, 'seconds_counted', v_seconds);
end;
$$;

-- ----------------------------------------------------------------------------
-- MISSION PROGRESS + CLAIM
-- ----------------------------------------------------------------------------
create or replace function public.bump_mission_progress(p_mission_type text, p_amount int default 1)
returns void
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_mission record;
begin
  for v_mission in select * from public.missions where mission_type = p_mission_type and active = true and is_daily = true loop
    insert into public.player_missions (player_id, mission_id, progress, assigned_date)
    values (v_player, v_mission.id, p_amount, current_date)
    on conflict (player_id, mission_id, assigned_date)
    do update set progress = least(public.player_missions.progress + p_amount, v_mission.target_count),
                  completed = (public.player_missions.progress + p_amount) >= v_mission.target_count;
  end loop;
end;
$$;

create or replace function public.claim_mission(p_mission_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_player uuid := auth.uid();
  v_pm public.player_missions%rowtype;
  v_mission public.missions%rowtype;
begin
  select * into v_pm from public.player_missions
    where player_id = v_player and mission_id = p_mission_id and assigned_date = current_date;
  select * into v_mission from public.missions where id = p_mission_id;

  if not found or not v_pm.completed then raise exception 'Mission not completed yet'; end if;
  if v_pm.claimed then raise exception 'Already claimed'; end if;

  update public.profiles set coins = coins + v_mission.reward_coins, gems = gems + v_mission.reward_gems,
    pack_tickets = pack_tickets + v_mission.reward_pack_tickets where id = v_player;
  update public.player_missions set claimed = true
    where player_id = v_player and mission_id = p_mission_id and assigned_date = current_date;

  return jsonb_build_object('coins', v_mission.reward_coins, 'gems', v_mission.reward_gems, 'pack_tickets', v_mission.reward_pack_tickets);
end;
$$;

