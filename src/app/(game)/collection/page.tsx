"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getOwnedCards, getAllCharacters, getRarities } from "@/lib/game/api";
import type { OwnedCard } from "@/lib/types/game";
import type { CharacterRow, Rarity } from "@/lib/types/database";
import { CardTile } from "@/components/CardTile";

type FilterKey = "ALL" | "OWNED" | "NOT_OWNED" | "LIMITED" | string; // rarity id also valid

export default function CollectionPage() {
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [all, setAll] = useState<(CharacterRow & { rarity_row: Rarity })[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [o, a, r] = await Promise.all([getOwnedCards(), getAllCharacters(), getRarities()]);
      setOwned(o);
      setAll(a);
      setRarities(r);
      setLoading(false);
    })();
  }, []);

  const ownedIds = useMemo(() => new Set(owned.map((o) => o.character_id)), [owned]);
  const ownedByCharId = useMemo(() => new Map(owned.map((o) => [o.character_id, o])), [owned]);

  const filtered = all.filter((c) => {
    if (filter === "OWNED" && !ownedIds.has(c.id)) return false;
    if (filter === "NOT_OWNED" && ownedIds.has(c.id)) return false;
    if (filter === "LIMITED" && !c.is_limited) return false;
    if (rarities.some((r) => r.id === filter) && c.rarity !== filter) return false;
    if (query && !`${c.character_name} ${c.anime}`.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) return <div className="pt-20 text-center text-zinc-500">Loading collection…</div>;

  return (
    <div className="space-y-3 pb-4">
      <h1 className="pt-2 text-lg font-bold">Collection</h1>
      <p className="text-sm text-zinc-400">
        {owned.length} / {all.length} Characters Collected
      </p>

      <input
        placeholder="Search character or anime…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-cyan-500"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["ALL", "OWNED", "NOT_OWNED", "LIMITED"] as FilterKey[]).map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f.replace("_", " ")}
          </FilterChip>
        ))}
        {rarities.map((r) => (
          <FilterChip key={r.id} active={filter === r.id} onClick={() => setFilter(r.id)}>
            {r.id}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((c) => {
          const ownedCard = ownedByCharId.get(c.id);
          return (
            <Link key={c.id} href={`/collection/${c.id}`}>
              <CardTile
                character={c}
                rarity={c.rarity_row}
                level={ownedCard?.level}
                owned={!!ownedCard}
                subLabel={ownedCard ? `Lv. ${ownedCard.level}` : "Not owned"}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
        active ? "bg-cyan-500 text-black" : "bg-zinc-900 text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
