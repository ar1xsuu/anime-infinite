import { createClient } from "@/lib/supabase/client";
import type {
  ProfileRow,
  CharacterRow,
  Rarity,
  PackRow,
  PackCharacterRow,
  PlayerCharacterRow,
  TowerFloorRow,
  EnemyRow,
  MissionRow,
  PlayerMissionRow,
  EventRow,
  MutationRow,
} from "@/lib/types/database";
import type { OwnedCard, TeamPower } from "@/lib/types/game";

const sb = () => createClient();

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------
export async function getProfile(): Promise<ProfileRow> {
  const supabase = sb();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function getRarities(): Promise<Rarity[]> {
  const { data, error } = await sb().from("rarities").select("*").order("sort_order");
  if (error) throw error;
  return data as Rarity[];
}

// ---------------------------------------------------------------------------
// COLLECTION / OWNED CARDS
// ---------------------------------------------------------------------------
export async function getOwnedCards(): Promise<OwnedCard[]> {
  const supabase = sb();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("player_characters")
    .select("*, character:characters(*, rarity_row:rarities(*))")
    .eq("player_id", auth.user.id)
    .order("obtained_at", { ascending: false });
  if (error) throw error;

  // Flatten the nested rarity row onto `rarity` for convenience
  return (data as unknown[]).map((row) => {
    const r = row as PlayerCharacterRow & { character: CharacterRow & { rarity_row: Rarity } };
    return { ...r, character: r.character, rarity: r.character.rarity_row } as OwnedCard;
  });
}

export async function getAllCharacters(): Promise<(CharacterRow & { rarity_row: Rarity })[]> {
  const { data, error } = await sb()
    .from("characters")
    .select("*, rarity_row:rarities(*)")
    .eq("active", true)
    .order("release_date", { ascending: false });
  if (error) throw error;
  return data as unknown as (CharacterRow & { rarity_row: Rarity })[];
}

export async function getCardPower(playerCharacterId: string) {
  const { data, error } = await sb().rpc("get_card_power", { p_player_character_id: playerCharacterId });
  if (error) throw error;
  return data as { attack: number; hp: number; income: number; crit_rate: number; tower_damage_pct_bonus: number };
}

// ---------------------------------------------------------------------------
// PACKS
// ---------------------------------------------------------------------------
export async function getActivePacks(): Promise<PackRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb()
    .from("packs")
    .select("*")
    .eq("active", true)
    .or(`start_at.is.null,start_at.lte.${nowIso}`)
    .order("sort_order");
  if (error) throw error;
  return (data as PackRow[]).filter((p) => !p.end_at || p.end_at >= nowIso);
}

export async function getPackCharacters(packId: string): Promise<(PackCharacterRow & { character: CharacterRow })[]> {
  const { data, error } = await sb()
    .from("pack_characters")
    .select("*, character:characters(*)")
    .eq("pack_id", packId);
  if (error) throw error;
  return data as unknown as (PackCharacterRow & { character: CharacterRow })[];
}

export async function openPack(packId: string) {
  const { data, error } = await sb().rpc("open_pack", { p_pack_id: packId });
  if (error) throw error;
  await bumpMission("open_packs", 1);
  return data as {
    character_id: string;
    character_name: string;
    anime: string;
    rarity: string;
    image_url: string | null;
    is_new: boolean;
    player_character_id: string;
  };
}

// ---------------------------------------------------------------------------
// UPGRADE / ASCEND
// ---------------------------------------------------------------------------
export async function upgradeCard(playerCharacterId: string, levels = 1) {
  const { data, error } = await sb().rpc("upgrade_card", {
    p_player_character_id: playerCharacterId,
    p_levels: levels,
  });
  if (error) throw error;
  await bumpMission("upgrade_cards", 1);
  return data as { new_level: number; coins_spent: number };
}

export async function ascendCard(playerCharacterId: string) {
  const { data, error } = await sb().rpc("ascend_card", { p_player_character_id: playerCharacterId });
  if (error) throw error;
  await bumpMission("ascend_card", 1);
  return data as { new_ascension_level: number; mutation_rolled: string | null };
}

export async function getMutations(): Promise<MutationRow[]> {
  const { data, error } = await sb().from("mutations").select("*").eq("active", true);
  if (error) throw error;
  return data as MutationRow[];
}

export async function getCardMutations(playerCharacterId: string) {
  const { data, error } = await sb()
    .from("character_mutations")
    .select("*, mutation:mutations(*)")
    .eq("player_character_id", playerCharacterId);
  if (error) throw error;
  return data as unknown as { mutation: MutationRow }[];
}

// ---------------------------------------------------------------------------
// TEAM
// ---------------------------------------------------------------------------
export async function getTeam() {
  const supabase = sb();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("*")
    .eq("player_id", auth.user.id)
    .single();
  if (teamErr) throw teamErr;

  const { data: members, error: memErr } = await supabase
    .from("team_members")
    .select("*, player_character:player_characters(*, character:characters(*, rarity_row:rarities(*)))")
    .eq("team_id", team.id)
    .order("slot");
  if (memErr) throw memErr;

  return { team, members: members ?? [] };
}

export async function assignTeam(playerCharacterIds: string[]) {
  const { data, error } = await sb().rpc("assign_team", { p_player_character_ids: playerCharacterIds });
  if (error) throw error;
  return data;
}

export async function getTeamPower(playerId: string): Promise<TeamPower> {
  const { data, error } = await sb().rpc("get_team_power", { p_player_id: playerId });
  if (error) throw error;
  return data as TeamPower;
}

// ---------------------------------------------------------------------------
// TOWER
// ---------------------------------------------------------------------------
export async function getTowerFloors(): Promise<(TowerFloorRow & { enemy: EnemyRow })[]> {
  const { data, error } = await sb()
    .from("tower_floors")
    .select("*, enemy:enemies(*)")
    .eq("active", true)
    .order("floor_number");
  if (error) throw error;
  return data as unknown as (TowerFloorRow & { enemy: EnemyRow })[];
}

export async function getTowerProgress(playerId: string) {
  const { data, error } = await sb()
    .from("player_tower_progress")
    .select("*")
    .eq("player_id", playerId)
    .single();
  if (error) throw error;
  return data as { player_id: string; highest_floor_cleared: number };
}

export async function fightFloor(floorNumber: number) {
  const { data, error } = await sb().rpc("fight_floor", { p_floor_number: floorNumber });
  if (error) throw error;
  if ((data as { win: boolean }).win) await bumpMission("clear_floors", 1);
  return data as {
    win: boolean;
    your_power: number;
    enemy_power: number;
    coins_awarded: number;
    gems_awarded: number;
    pack_tickets_awarded: number;
    first_clear: boolean;
  };
}

// ---------------------------------------------------------------------------
// OFFLINE INCOME
// ---------------------------------------------------------------------------
export async function claimOfflineIncome() {
  const { data, error } = await sb().rpc("claim_offline_income");
  if (error) throw error;
  return data as { coins_awarded: number; seconds_counted: number };
}

// ---------------------------------------------------------------------------
// MISSIONS
// ---------------------------------------------------------------------------
export async function getTodaysMissions(): Promise<(PlayerMissionRow & { mission: MissionRow })[]> {
  const supabase = sb();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");

  const missions = await supabase.from("missions").select("*").eq("active", true).eq("is_daily", true);
  if (missions.error) throw missions.error;

  const today = new Date().toISOString().slice(0, 10);
  const existing = await supabase
    .from("player_missions")
    .select("*")
    .eq("player_id", auth.user.id)
    .eq("assigned_date", today);
  if (existing.error) throw existing.error;

  const byMission = new Map(existing.data?.map((pm) => [pm.mission_id, pm]));
  return (missions.data as MissionRow[]).map((m) => ({
    mission: m,
    player_id: auth.user!.id,
    mission_id: m.id,
    progress: byMission.get(m.id)?.progress ?? 0,
    completed: byMission.get(m.id)?.completed ?? false,
    claimed: byMission.get(m.id)?.claimed ?? false,
    assigned_date: today,
  }));
}

async function bumpMission(missionType: string, amount: number) {
  try {
    await sb().rpc("bump_mission_progress", { p_mission_type: missionType, p_amount: amount });
  } catch {
    // best-effort — a failed mission bump should never block core gameplay
  }
}

export async function claimMission(missionId: string) {
  const { data, error } = await sb().rpc("claim_mission", { p_mission_id: missionId });
  if (error) throw error;
  return data as { coins: number; gems: number; pack_tickets: number };
}

// ---------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------
export async function getActiveEvents(): Promise<EventRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb()
    .from("events")
    .select("*")
    .eq("active", true)
    .lte("start_at", nowIso)
    .gte("end_at", nowIso);
  if (error) throw error;
  return data as EventRow[];
}
