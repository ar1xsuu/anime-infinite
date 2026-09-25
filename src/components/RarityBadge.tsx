import type { Rarity } from "@/lib/types/database";

export function RarityBadge({ rarity }: { rarity: Pick<Rarity, "id" | "name" | "color_hex" | "glow"> }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase"
      style={{
        color: rarity.color_hex,
        backgroundColor: `${rarity.color_hex}22`,
        border: `1px solid ${rarity.color_hex}66`,
        boxShadow: rarity.glow ? `0 0 8px ${rarity.color_hex}99` : undefined,
      }}
    >
      {rarity.id}
    </span>
  );
}
