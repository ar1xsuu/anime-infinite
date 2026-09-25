import Image from "next/image";
import type { Rarity, CharacterRow } from "@/lib/types/database";
import { RarityBadge } from "./RarityBadge";

export function CardTile({
  character,
  rarity,
  level,
  owned = true,
  selected = false,
  onClick,
  subLabel,
}: {
  character: Pick<CharacterRow, "character_name" | "image_url" | "is_infinite" | "is_limited">;
  rarity: Pick<Rarity, "id" | "name" | "color_hex" | "glow">;
  level?: number;
  owned?: boolean;
  selected?: boolean;
  onClick?: () => void;
  subLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative flex flex-col overflow-hidden rounded-xl bg-zinc-900 text-left transition
        ${selected ? "ring-2 ring-cyan-400" : "ring-1 ring-zinc-800"}
        ${!owned ? "opacity-40 grayscale" : ""}
        ${onClick ? "active:scale-95" : ""}`}
      style={{
        boxShadow: owned && rarity.glow ? `0 0 14px ${rarity.color_hex}55` : undefined,
        borderColor: rarity.color_hex,
      }}
    >
      <div className="relative aspect-[3/4] w-full bg-zinc-800">
        {character.image_url ? (
          <Image
            src={character.image_url}
            alt={character.character_name}
            fill
            sizes="140px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🎴</div>
        )}
        {character.is_infinite && (
          <span className="absolute left-1 top-1 rounded bg-cyan-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            ♾️ INFINITE
          </span>
        )}
        {character.is_limited && !character.is_infinite && (
          <span className="absolute left-1 top-1 rounded bg-fuchsia-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            LIMITED
          </span>
        )}
        <div className="absolute right-1 top-1">
          <RarityBadge rarity={rarity} />
        </div>
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-semibold text-zinc-100">{character.character_name}</p>
        <p className="truncate text-[11px] text-zinc-400">
          {subLabel ?? (level ? `Lv. ${level}` : "")}
        </p>
      </div>
    </button>
  );
}
