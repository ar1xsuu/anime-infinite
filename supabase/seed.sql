-- ============================================================================
-- ANIME INFINITE — DEMO SEED CONTENT
-- ============================================================================
-- Run AFTER schema.sql and functions.sql. Populates the prototype with
-- recognizable characters (placeholder art) so you can see the whole system
-- working before uploading your own/licensed art via the Admin Panel.
-- Image URLs point at placeholder art (replace via Admin > Characters later).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ABILITIES
-- ----------------------------------------------------------------------------
insert into public.abilities (id, name, description, icon, effect_type, effect_value) values
  (gen_random_uuid(), 'Gear Second', 'Boosts attack in tower combat', '💨', 'attack_flat', 50),
  (gen_random_uuid(), 'Kamehameha', 'Massive tower damage burst', '🔵', 'tower_damage_pct', 25),
  (gen_random_uuid(), 'Sage Mode', 'Increases income generation', '🍃', 'income_multiplier', 15),
  (gen_random_uuid(), 'Domain Expansion', 'Guarantees bonus tower damage', '🌀', 'tower_damage_pct', 40),
  (gen_random_uuid(), 'Total Concentration', 'Raises attack and crit rate', '🔥', 'attack_flat', 40);

-- ----------------------------------------------------------------------------
-- MUTATIONS  (section 12)
-- ----------------------------------------------------------------------------
insert into public.mutations (id, name, description, icon, color_hex, rarity, stat_modifiers, effects, drop_chance) values
  (gen_random_uuid(), 'Swift Mutation', '+20% Income, +10% Attack', '💨', '#38bdf8', 'SR', '{"income_pct":20,"attack_pct":10}', '[]', 0.05),
  (gen_random_uuid(), 'Blazing Mutation', '+50% Attack', '🔥', '#f97316', 'SSR', '{"attack_pct":50}', '[]', 0.03),
  (gen_random_uuid(), 'Void Mutation', '+30% Tower Damage', '🕳️', '#7c3aed', 'UR', '{"tower_damage_pct":30}', '[]', 0.02),
  (gen_random_uuid(), 'Royal Mutation', '+100% Income', '👑', '#facc15', 'LR', '{"income_pct":100}', '[]', 0.008),
  (gen_random_uuid(), 'Celestial Mutation', '+150% Income, +50% Tower Damage', '✨', '#22d3ee', 'INFINITE', '{"income_pct":150,"tower_damage_pct":50}', '[]', 0.003);

-- ----------------------------------------------------------------------------
-- CHARACTERS  (section 35 — demo content, placeholder art)
-- ----------------------------------------------------------------------------
insert into public.characters (id, character_name, anime, description, image_url, rarity, tags, mutation_slots, is_infinite) values
  (gen_random_uuid(), 'Monkey D. Luffy', 'One Piece', 'The rubber-powered captain of the Straw Hat Pirates.', '/placeholder-cards/luffy.svg', 'UR', '{Shonen,Pirate,Main Character}', 2, false),
  (gen_random_uuid(), 'Roronoa Zoro', 'One Piece', 'Three-sword-style swordsman aiming to be the world''s best.', '/placeholder-cards/zoro.svg', 'SSR', '{Shonen,Pirate,Swordsman}', 1, false),
  (gen_random_uuid(), 'Sanji', 'One Piece', 'The Straw Hats'' chivalrous cook and fighter.', '/placeholder-cards/sanji.svg', 'SR', '{Shonen,Pirate}', 1, false),
  (gen_random_uuid(), 'Goku', 'Dragon Ball', 'Saiyan warrior who trains endlessly to get stronger.', '/placeholder-cards/goku.svg', 'LR', '{Shonen,Saiyan,Main Character}', 2, false),
  (gen_random_uuid(), 'Vegeta', 'Dragon Ball', 'Prince of the Saiyans, driven by pride and rivalry.', '/placeholder-cards/vegeta.svg', 'UR', '{Shonen,Saiyan}', 1, false),
  (gen_random_uuid(), 'Naruto Uzumaki', 'Naruto', 'Jinchuriki of the Nine-Tails, dreams of becoming Hokage.', '/placeholder-cards/naruto.svg', 'UR', '{Shonen,Ninja,Main Character}', 2, false),
  (gen_random_uuid(), 'Sasuke Uchiha', 'Naruto', 'Last of the Uchiha clan, master of the Sharingan.', '/placeholder-cards/sasuke.svg', 'SSR', '{Shonen,Ninja}', 1, false),
  (gen_random_uuid(), 'Ichigo Kurosaki', 'Bleach', 'Substitute Soul Reaper wielding a massive zanpakuto.', '/placeholder-cards/ichigo.svg', 'SSR', '{Shonen,Swordsman,Main Character}', 1, false),
  (gen_random_uuid(), 'Satoru Gojo', 'Jujutsu Kaisen', 'The strongest sorcerer, master of Limitless and Six Eyes.', '/placeholder-cards/gojo.svg', 'LR', '{Shonen,Sorcerer,Hero}', 2, false),
  (gen_random_uuid(), 'Sukuna', 'Jujutsu Kaisen', 'The King of Curses, feared across every era.', '/placeholder-cards/sukuna.svg', 'UR', '{Sorcerer,Villain}', 1, false),
  (gen_random_uuid(), 'Tanjiro Kamado', 'Demon Slayer', 'Kind-hearted demon slayer wielding Water Breathing.', '/placeholder-cards/tanjiro.svg', 'SR', '{Shonen,Swordsman,Main Character}', 1, false),
  (gen_random_uuid(), 'Nezuko Kamado', 'Demon Slayer', 'Tanjiro''s demon sister who fights to protect humans.', '/placeholder-cards/nezuko.svg', 'SR', '{Shonen,Demon}', 1, false),
  (gen_random_uuid(), 'Rookie Swordsman', 'Anime Infinite', 'A common trainee still finding their style.', '/placeholder-cards/common1.svg', 'N', '{Swordsman}', 0, false),
  (gen_random_uuid(), 'Academy Student', 'Anime Infinite', 'A fresh graduate eager to prove themselves.', '/placeholder-cards/common2.svg', 'N', '{Ninja}', 0, false),
  (gen_random_uuid(), 'Village Guard', 'Anime Infinite', 'A steady defender of the home village.', '/placeholder-cards/common3.svg', 'R', '{Hero}', 0, false);

-- Limited character example (section 13)
insert into public.characters (id, character_name, anime, description, image_url, rarity, tags, mutation_slots, is_limited, limited_start, limited_end) values
  (gen_random_uuid(), 'Goku — Ultra Instinct', 'Dragon Ball', 'A god-tier state reserved for the direst battles.', '/placeholder-cards/goku-ui.svg', 'LR', '{Shonen,Saiyan,Main Character}', 3, true, now(), now() + interval '10 days');

-- Infinite character example (section 14)
insert into public.characters (id, character_name, anime, description, image_url, rarity, tags, mutation_slots, is_infinite) values
  (gen_random_uuid(), 'Gojo — Limitless', 'Jujutsu Kaisen', 'Unbound by conventional limits — buffs the whole team.', '/placeholder-cards/gojo-infinite.svg', 'INFINITE', '{Sorcerer,Hero}', 3, true);

-- ----------------------------------------------------------------------------
-- PACKS  (section 7)  — weights sum to 100 within each pack
-- ----------------------------------------------------------------------------
insert into public.packs (id, name, description, image_url, cost, currency_id, min_rarity, max_rarity, active, sort_order) values
  (gen_random_uuid(), 'Basic Pack', 'Cheap and mostly common cards.', '/placeholder-packs/basic.svg', 200, 'coins', 'N', 'SR', true, 1),
  (gen_random_uuid(), 'Premium Pack', 'Better odds at SR+ cards.', '/placeholder-packs/premium.svg', 50, 'gems', 'R', 'LR', true, 2),
  (gen_random_uuid(), 'Mythic Pack', 'Higher chance of SSR/UR.', '/placeholder-packs/mythic.svg', 120, 'gems', 'SR', 'LR', true, 3),
  (gen_random_uuid(), 'Infinite Pack', 'Extremely rare endgame content.', '/placeholder-packs/infinite.svg', 500, 'gems', 'UR', 'INFINITE', true, 5);

-- Basic Pack: mostly N/R, rare SR (weights ~ N45 R35 SR20)
insert into public.pack_characters (pack_id, character_id, weight)
select p.id, c.id, case c.rarity when 'N' then 22.5 when 'R' then 17.5 when 'SR' then 10 else 1 end
from public.packs p, public.characters c
where p.name = 'Basic Pack' and c.rarity in ('N','R','SR');

-- Premium Pack: R45 SR35 SSR15 UR4 LR1
insert into public.pack_characters (pack_id, character_id, weight)
select p.id, c.id, case c.rarity
    when 'R' then 15 when 'SR' then 11.67 when 'SSR' then 5 when 'UR' then 1.33 when 'LR' then 0.5
  end
from public.packs p, public.characters c
where p.name = 'Premium Pack' and c.rarity in ('R','SR','SSR','UR','LR') and c.is_limited = false;

-- Mythic Pack: SR30 SSR40 UR25 LR5
insert into public.pack_characters (pack_id, character_id, weight)
select p.id, c.id, case c.rarity
    when 'SR' then 10 when 'SSR' then 13.3 when 'UR' then 8.3 when 'LR' then 2.5
  end
from public.packs p, public.characters c
where p.name = 'Mythic Pack' and c.rarity in ('SR','SSR','UR','LR') and c.is_limited = false;

-- Infinite Pack: UR60 LR35 INFINITE5
insert into public.pack_characters (pack_id, character_id, weight)
select p.id, c.id, case c.rarity when 'UR' then 30 when 'LR' then 17.5 when 'INFINITE' then 5 end
from public.packs p, public.characters c
where p.name = 'Infinite Pack' and c.rarity in ('UR','LR','INFINITE') and c.is_limited = false;

-- Limited Pack example, tied to an event, featuring the limited character
insert into public.packs (id, name, description, image_url, cost, currency_id, min_rarity, max_rarity, is_limited, start_at, end_at, active, sort_order)
select gen_random_uuid(), 'Void Summon (Limited)', 'Event pack featuring Goku — Ultra Instinct.', '/placeholder-packs/limited.svg',
       80, 'gems', 'SSR', 'LR', true, now(), now() + interval '10 days', true, 4;

insert into public.pack_characters (pack_id, character_id, weight)
select (select id from public.packs where name = 'Void Summon (Limited)'), c.id,
  case c.character_name when 'Goku — Ultra Instinct' then 5 else 15 end
from public.characters c
where c.character_name in ('Goku — Ultra Instinct', 'Satoru Gojo', 'Monkey D. Luffy');

-- ----------------------------------------------------------------------------
-- EVENT  (section 27) tied to the limited pack/character
-- ----------------------------------------------------------------------------
insert into public.events (id, name, description, banner_image_url, start_at, end_at, active)
values (gen_random_uuid(), 'Void Summon', 'A rare rift has opened — Ultra Instinct Goku is available for a limited time.',
        '/placeholder-events/void-summon.svg', now(), now() + interval '10 days', true);

insert into public.event_characters (event_id, character_id)
select (select id from public.events where name = 'Void Summon'), id from public.characters where character_name = 'Goku — Ultra Instinct';

-- ----------------------------------------------------------------------------
-- TEAM BONUS RULES  (section 15)
-- ----------------------------------------------------------------------------
insert into public.team_bonus_rules (tag, required_count, effect_type, effect_value) values
  ('Shonen', 3, 'income_pct', 10),
  ('Swordsman', 2, 'attack_pct', 10),
  ('Main Character', 3, 'tower_damage_pct', 15);

-- ----------------------------------------------------------------------------
-- ENEMIES + TOWER FLOORS  (section 16) — 30 floors, boss every 10th
-- ----------------------------------------------------------------------------
do $$
declare
  i int;
  v_enemy_id uuid;
  v_is_boss boolean;
  v_hp bigint; v_atk bigint;
begin
  for i in 1..30 loop
    v_is_boss := (i % 10 = 0);
    v_hp := (500 * power(1.22, i))::bigint;
    v_atk := (150 * power(1.20, i))::bigint;
    if v_is_boss then
      v_hp := v_hp * 4;
      v_atk := v_atk * 2;
    end if;

    insert into public.enemies (id, name, image_url, hp, attack)
    values (gen_random_uuid(),
            case when v_is_boss then 'Floor ' || i || ' Boss' else 'Wandering Spirit ' || i end,
            case when v_is_boss then '/placeholder-enemies/boss.svg' else '/placeholder-enemies/mob.svg' end,
            v_hp, v_atk)
    returning id into v_enemy_id;

    insert into public.tower_floors (floor_number, enemy_id, required_power, coin_reward, gem_reward,
                                      pack_ticket_reward, first_clear_bonus_coins, first_clear_bonus_gems, is_boss)
    values (i, v_enemy_id, (v_atk + v_hp * 0.1)::bigint,
            (200 * power(1.18, i))::bigint,
            case when v_is_boss then 20 else 0 end,
            case when v_is_boss then 1 else 0 end,
            (500 * power(1.18, i))::bigint,
            case when v_is_boss then 50 else 5 end,
            v_is_boss);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- DAILY MISSIONS  (section 19)
-- ----------------------------------------------------------------------------
insert into public.missions (name, description, mission_type, target_count, reward_coins, reward_gems) values
  ('Pack Opener', 'Open 3 packs', 'open_packs', 3, 1000, 5),
  ('Card Trainer', 'Upgrade 5 cards', 'upgrade_cards', 5, 1500, 0),
  ('Tower Climber', 'Clear 5 Tower floors', 'clear_floors', 5, 2000, 10),
  ('Coin Collector', 'Collect 10,000 coins', 'collect_coins', 10000, 500, 0),
  ('Evolver', 'Ascend a card', 'ascend_card', 1, 0, 20);
