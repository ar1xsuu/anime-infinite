"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow, CharacterRow } from "@/lib/types/database";

export function PlayersEditor({ players: initialPlayers }: { players: ProfileRow[] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = players.filter((p) => p.username.toLowerCase().includes(query.toLowerCase()));

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setPlayers(data);
  }

  return (
    <div>
      <input
        placeholder="Search by username…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
      />
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <button
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="font-bold">
                  {p.username} {p.is_admin && <span className="text-xs text-cyan-400">(admin)</span>}
                </p>
                <p className="text-xs text-zinc-500">
                  Lv.{p.level} · {p.coins}🪙 · {p.gems}💎 · Floor {p.tower_floor}
                </p>
              </div>
              <span className="text-zinc-500">{expanded === p.id ? "▲" : "▼"}</span>
            </button>
            {expanded === p.id && <PlayerTools player={p} onChanged={refresh} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerTools({ player, onChanged }: { player: ProfileRow; onChanged: () => void }) {
  const [coins, setCoins] = useState(1000);
  const [gems, setGems] = useState(100);
  const [floor, setFloor] = useState(player.tower_floor);
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedChar, setSelectedChar] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("characters").select("*").order("character_name");
      setCharacters(data ?? []);
      setSelectedChar(data?.[0]?.id ?? "");
    })();
  }, []);

  async function giveCoins() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ coins: player.coins + coins }).eq("id", player.id);
    await supabase.from("transactions").insert({
      player_id: player.id,
      type: "admin_grant",
      detail: { note: "admin coin grant" },
      coins_delta: coins,
    });
    setBusy(false);
    onChanged();
  }

  async function giveGems() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ gems: player.gems + gems }).eq("id", player.id);
    setBusy(false);
    onChanged();
  }

  async function giveCard() {
    if (!selectedChar) return;
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("player_characters")
      .upsert({ player_id: player.id, character_id: selectedChar }, { onConflict: "player_id,character_id" });
    setBusy(false);
    onChanged();
  }

  async function setTowerFloor() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ tower_floor: floor }).eq("id", player.id);
    await supabase
      .from("player_tower_progress")
      .update({ highest_floor_cleared: Math.max(0, floor - 1) })
      .eq("player_id", player.id);
    setBusy(false);
    onChanged();
  }

  async function resetPlayer() {
    if (!confirm(`Reset ${player.username}'s progress? This deletes all their cards.`)) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("player_characters").delete().eq("player_id", player.id);
    await supabase
      .from("profiles")
      .update({ coins: 1000, gems: 100, pack_tickets: 3, tower_floor: 1, level: 1, xp: 0 })
      .eq("id", player.id);
    await supabase.from("player_tower_progress").update({ highest_floor_cleared: 0 }).eq("player_id", player.id);
    setBusy(false);
    onChanged();
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ToolRow label="Give Coins">
          <input type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))} className={inputCls} />
          <button onClick={giveCoins} disabled={busy} className={btnCls}>
            Give
          </button>
        </ToolRow>
        <ToolRow label="Give Gems">
          <input type="number" value={gems} onChange={(e) => setGems(Number(e.target.value))} className={inputCls} />
          <button onClick={giveGems} disabled={busy} className={btnCls}>
            Give
          </button>
        </ToolRow>
        <ToolRow label="Set Tower Floor">
          <input type="number" value={floor} onChange={(e) => setFloor(Number(e.target.value))} className={inputCls} />
          <button onClick={setTowerFloor} disabled={busy} className={btnCls}>
            Set
          </button>
        </ToolRow>
        <ToolRow label="Give Card">
          <select value={selectedChar} onChange={(e) => setSelectedChar(e.target.value)} className={inputCls}>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.character_name}
              </option>
            ))}
          </select>
          <button onClick={giveCard} disabled={busy} className={btnCls}>
            Give
          </button>
        </ToolRow>
      </div>
      <button onClick={resetPlayer} disabled={busy} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-400">
        Reset Player
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs";
const btnCls = "mt-1 w-full rounded-md bg-cyan-500 py-1 text-xs font-bold text-black disabled:opacity-50";

function ToolRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
