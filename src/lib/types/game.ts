import type { CharacterRow, PlayerCharacterRow, Rarity } from "./database";

/** A player-owned card, joined with its character template and rarity config. */
export type OwnedCard = PlayerCharacterRow & {
  character: CharacterRow;
  rarity: Rarity;
};

/** Effective computed stats returned by the get_card_power() RPC. */
export type CardPower = {
  attack: number;
  hp: number;
  income: number;
  crit_rate: number;
  tower_damage_pct_bonus: number;
};

/** Result shape returned by the get_team_power() RPC. */
export type TeamPower = {
  attack: number;
  hp: number;
  income_per_sec: number;
  tower_damage_pct_bonus: number;
  power: number;
};
