"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Rarity } from "@/lib/types/database";

export function RaritiesEditor({ rarities }: { rarities: Rarity[] }) {
  return (
    <div className="space-y-2">
      {rarities.map((r) => (
        <RarityRow key={r.id} rarity={r} />
      ))}
      <AddRarityButton />
    </div>
  );
}

function RarityRow({ rarity }: { rarity: Rarity }) {
  const router = useRouter();
  const [name, setName] = useState(rarity.name);
  const [color, setColor] = useState(rarity.color_hex);
  const [maxLevel, setMaxLevel] = useState(rarity.max_level);
  const [baseAttack, setBaseAttack] = useState(rarity.base_attack);
  const [baseHp, setBaseHp] = useState(rarity.base_hp);
  const [baseIncome, setBaseIncome] = useState(rarity.base_income);
  const [ascensionLevels, setAscensionLevels] = useState(rarity.ascension_levels);
  const [ascensionMult, setAscensionMult] = useState(rarity.ascension_stat_multiplier);
  const [glow, setGlow] = useState(rarity.glow);
  const [active, setActive] = useState(rarity.active);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function mark<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("rarities")
      .update({
        name,
        color_hex: color,
        max_level: maxLevel,
        base_attack: baseAttack,
        base_hp: baseHp,
        base_income: baseIncome,
        ascension_levels: ascensionLevels,
        ascension_stat_multiplier: ascensionMult,
        glow,
        active,
      })
      .eq("id", rarity.id);
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded px-2 py-0.5 text-xs font-bold"
          style={{ color, backgroundColor: `${color}22` }}
        >
          {rarity.id}
        </span>
        {dirty && (
          <button onClick={handleSave} disabled={saving} className="text-xs font-bold text-cyan-400">
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Labeled label="Name">
          <input value={name} onChange={(e) => mark(setName)(e.target.value)} className={inputCls} />
        </Labeled>
        <Labeled label="Color">
          <input type="color" value={color} onChange={(e) => mark(setColor)(e.target.value)} className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-950" />
        </Labeled>
        <Labeled label="Max Level">
          <input type="number" value={maxLevel} onChange={(e) => mark(setMaxLevel)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <Labeled label="Base Attack">
          <input type="number" value={baseAttack} onChange={(e) => mark(setBaseAttack)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <Labeled label="Base HP">
          <input type="number" value={baseHp} onChange={(e) => mark(setBaseHp)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <Labeled label="Base Income">
          <input type="number" value={baseIncome} onChange={(e) => mark(setBaseIncome)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <Labeled label="Ascension Tiers">
          <input type="number" value={ascensionLevels} onChange={(e) => mark(setAscensionLevels)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <Labeled label="Ascension Mult.">
          <input type="number" step="0.05" value={ascensionMult} onChange={(e) => mark(setAscensionMult)(Number(e.target.value))} className={inputCls} />
        </Labeled>
        <label className="flex items-center gap-1.5 self-end text-xs text-zinc-300">
          <input type="checkbox" checked={glow} onChange={(e) => mark(setGlow)(e.target.checked)} />
          Glow effect
        </label>
        <label className="flex items-center gap-1.5 self-end text-xs text-zinc-300">
          <input type="checkbox" checked={active} onChange={(e) => mark(setActive)(e.target.checked)} />
          Active
        </label>
      </div>
    </div>
  );
}

function AddRarityButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    const id = prompt("New rarity ID (short code, e.g. 'MR'):");
    if (!id) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("rarities").insert({
      id: id.toUpperCase(),
      name: id,
      sort_order: 999,
      color_hex: "#888888",
    });
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleAdd}
      disabled={busy}
      className="w-full rounded-lg border border-dashed border-zinc-700 py-3 text-sm text-zinc-400"
    >
      + Add Rarity Tier
    </button>
  );
}

const inputCls = "w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
