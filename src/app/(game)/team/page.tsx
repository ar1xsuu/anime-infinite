"use client";

import { useEffect, useState, useCallback } from "react";
import { getOwnedCards, getTeam, assignTeam, getTeamPower, getProfile } from "@/lib/game/api";
import type { OwnedCard, TeamPower } from "@/lib/types/game";
import { CardTile } from "@/components/CardTile";
import { formatNumber } from "@/lib/format";

export default function TeamPage() {
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [maxSlots, setMaxSlots] = useState(3);
  const [selected, setSelected] = useState<string[]>([]); // player_character_id[]
  const [power, setPower] = useState<TeamPower | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [owned, teamData, profile] = await Promise.all([getOwnedCards(), getTeam(), getProfile()]);
    setCards(owned);
    setMaxSlots(teamData.team.max_slots);
    setSelected(
      teamData.members
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((m) => m.player_character_id)
    );
    const p = await getTeamPower(profile.id);
    setPower(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleCard(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSlots) return prev; // slots full
      return [...prev, id];
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await assignTeam(selected);
      const profile = await getProfile();
      const p = await getTeamPower(profile.id);
      setPower(p);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="pt-20 text-center text-zinc-500">Loading team…</div>;

  return (
    <div className="space-y-4 pb-4">
      <h1 className="pt-2 text-lg font-bold">Team</h1>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="mb-2 text-xs font-semibold text-zinc-400">
          Active Team ({selected.length}/{maxSlots})
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: maxSlots }).map((_, i) => {
            const cardId = selected[i];
            const card = cards.find((c) => c.id === cardId);
            return (
              <div
                key={i}
                className="flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950"
              >
                {card ? (
                  <CardTile character={card.character} rarity={card.rarity} level={card.level} />
                ) : (
                  <span className="text-2xl text-zinc-700">+</span>
                )}
              </div>
            );
          })}
        </div>

        {power && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold">{formatNumber(power.attack)}</p>
              <p className="text-zinc-500">Attack</p>
            </div>
            <div>
              <p className="font-bold">{formatNumber(power.income_per_sec)}</p>
              <p className="text-zinc-500">Income/s</p>
            </div>
            <div>
              <p className="font-bold">{formatNumber(power.power)}</p>
              <p className="text-zinc-500">Total Power</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-black active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Team"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-400">Your Cards — tap to add/remove</p>
        <div className="grid grid-cols-3 gap-2">
          {cards.map((c) => (
            <CardTile
              key={c.id}
              character={c.character}
              rarity={c.rarity}
              level={c.level}
              selected={selected.includes(c.id)}
              onClick={() => toggleCard(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
