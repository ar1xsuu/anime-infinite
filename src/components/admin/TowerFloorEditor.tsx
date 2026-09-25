"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TowerFloorRow, EnemyRow } from "@/lib/types/database";

type Floor = TowerFloorRow & { enemy: EnemyRow };

export function TowerFloorEditor({ floors }: { floors: Floor[] }) {
  return (
    <div className="space-y-2">
      {floors.map((f) => (
        <FloorRow key={f.id} floor={f} />
      ))}
      <AddFloorButton nextFloorNumber={(floors.at(-1)?.floor_number ?? 0) + 1} />
    </div>
  );
}

function FloorRow({ floor }: { floor: Floor }) {
  const router = useRouter();
  const [enemyName, setEnemyName] = useState(floor.enemy?.name ?? "");
  const [hp, setHp] = useState(floor.enemy?.hp ?? 0);
  const [attack, setAttack] = useState(floor.enemy?.attack ?? 0);
  const [requiredPower, setRequiredPower] = useState(floor.required_power);
  const [coinReward, setCoinReward] = useState(floor.coin_reward);
  const [gemReward, setGemReward] = useState(floor.gem_reward);
  const [isBoss, setIsBoss] = useState(floor.is_boss);
  const [active, setActive] = useState(floor.active);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function mark<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    if (floor.enemy_id) {
      await supabase.from("enemies").update({ name: enemyName, hp, attack }).eq("id", floor.enemy_id);
    }
    await supabase
      .from("tower_floors")
      .update({
        required_power: requiredPower,
        coin_reward: coinReward,
        gem_reward: gemReward,
        is_boss: isBoss,
        active,
      })
      .eq("id", floor.id);
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete Floor ${floor.floor_number}?`)) return;
    const supabase = createClient();
    await supabase.from("tower_floors").delete().eq("id", floor.id);
    if (floor.enemy_id) await supabase.from("enemies").delete().eq("id", floor.enemy_id);
    router.refresh();
  }

  return (
    <div
      className={`rounded-xl border p-3 ${isBoss ? "border-red-500/40 bg-red-500/5" : "border-zinc-800 bg-zinc-900"}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">Floor {floor.floor_number}</p>
        <div className="space-x-2 text-xs">
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="font-bold text-cyan-400">
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <button onClick={handleDelete} className="text-red-400">
            Delete
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <LabeledInput label="Enemy Name" value={enemyName} onChange={mark(setEnemyName)} />
        <LabeledInput label="Enemy HP" type="number" value={hp} onChange={mark(setHp)} />
        <LabeledInput label="Enemy Attack" type="number" value={attack} onChange={mark(setAttack)} />
        <LabeledInput label="Required Power" type="number" value={requiredPower} onChange={mark(setRequiredPower)} />
        <LabeledInput label="Coin Reward" type="number" value={coinReward} onChange={mark(setCoinReward)} />
        <LabeledInput label="Gem Reward" type="number" value={gemReward} onChange={mark(setGemReward)} />
        <label className="flex items-center gap-1.5 self-end text-xs text-zinc-300">
          <input type="checkbox" checked={isBoss} onChange={(e) => mark(setIsBoss)(e.target.checked)} />
          Boss floor
        </label>
        <label className="flex items-center gap-1.5 self-end text-xs text-zinc-300">
          <input type="checkbox" checked={active} onChange={(e) => mark(setActive)(e.target.checked)} />
          Active
        </label>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: never) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-zinc-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange((type === "number" ? Number(e.target.value) : e.target.value) as never)}
        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs"
      />
    </div>
  );
}

function AddFloorButton({ nextFloorNumber }: { nextFloorNumber: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setBusy(true);
    const supabase = createClient();
    const { data: enemy, error: enemyErr } = await supabase
      .from("enemies")
      .insert({ name: `New Enemy ${nextFloorNumber}`, hp: 1000, attack: 200 })
      .select("id")
      .single();
    if (enemyErr || !enemy) {
      setBusy(false);
      alert(enemyErr?.message);
      return;
    }
    await supabase.from("tower_floors").insert({
      floor_number: nextFloorNumber,
      enemy_id: enemy.id,
      required_power: 1000,
      coin_reward: 500,
      gem_reward: 0,
      is_boss: false,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleAdd}
      disabled={busy}
      className="w-full rounded-lg border border-dashed border-zinc-700 py-3 text-sm text-zinc-400"
    >
      {busy ? "Adding…" : `+ Add Floor ${nextFloorNumber}`}
    </button>
  );
}
