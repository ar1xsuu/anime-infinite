"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MissionRow } from "@/lib/types/database";

const MISSION_TYPES = ["open_packs", "upgrade_cards", "clear_floors", "collect_coins", "ascend_card"];

export function MissionsEditor({ missions }: { missions: MissionRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(MISSION_TYPES[0]);
  const [target, setTarget] = useState(3);
  const [rewardCoins, setRewardCoins] = useState(1000);
  const [rewardGems, setRewardGems] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("missions").insert({
      name,
      description,
      mission_type: type,
      target_count: target,
      reward_coins: rewardCoins,
      reward_gems: rewardGems,
      is_daily: true,
    });
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setName("");
    setDescription("");
    router.refresh();
  }

  async function toggleActive(m: MissionRow) {
    const supabase = createClient();
    await supabase.from("missions").update({ active: !m.active }).eq("id", m.id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this mission?")) return;
    const supabase = createClient();
    await supabase.from("missions").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-6">
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputCls} sm:col-span-2`}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          {MISSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} placeholder="Target" className={inputCls} />
        <input type="number" value={rewardCoins} onChange={(e) => setRewardCoins(Number(e.target.value))} placeholder="Reward Coins" className={inputCls} />
        <input type="number" value={rewardGems} onChange={(e) => setRewardGems(Number(e.target.value))} placeholder="Reward Gems" className={inputCls} />
        <button type="submit" disabled={saving} className="col-span-2 rounded-lg bg-cyan-500 py-2 text-sm font-bold text-black sm:col-span-6">
          + Add Mission
        </button>
      </form>

      <div className="space-y-1.5">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-[11px] text-zinc-500">
                {m.mission_type} · target {m.target_count} · +{m.reward_coins}🪙 +{m.reward_gems}💎
              </p>
            </div>
            <div className="space-x-2 text-xs">
              <button onClick={() => toggleActive(m)} className="text-zinc-400">
                {m.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-red-400">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs";
