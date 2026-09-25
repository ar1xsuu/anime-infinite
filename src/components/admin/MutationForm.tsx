"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MutationRow, Rarity } from "@/lib/types/database";

export function MutationForm({ mutation, rarities }: { mutation: MutationRow | null; rarities: Rarity[] }) {
  const router = useRouter();
  const isNew = !mutation;

  const [name, setName] = useState(mutation?.name ?? "");
  const [description, setDescription] = useState(mutation?.description ?? "");
  const [icon, setIcon] = useState(mutation?.icon ?? "✨");
  const [colorHex, setColorHex] = useState(mutation?.color_hex ?? "#a855f7");
  const [rarity, setRarity] = useState(mutation?.rarity ?? rarities[0]?.id ?? "");
  const [incomePct, setIncomePct] = useState(mutation?.stat_modifiers?.income_pct ?? 0);
  const [attackPct, setAttackPct] = useState(mutation?.stat_modifiers?.attack_pct ?? 0);
  const [towerPct, setTowerPct] = useState(mutation?.stat_modifiers?.tower_damage_pct ?? 0);
  const [dropChance, setDropChance] = useState(mutation?.drop_chance ?? 0.01);
  const [active, setActive] = useState(mutation?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || null,
      icon,
      color_hex: colorHex,
      rarity: rarity || null,
      stat_modifiers: { income_pct: incomePct, attack_pct: attackPct, tower_damage_pct: towerPct },
      effects: [],
      drop_chance: dropChance,
      active,
    };

    const supabase = createClient();
    const { error } = isNew
      ? await supabase.from("mutations").insert(payload)
      : await supabase.from("mutations").update(payload).eq("id", mutation!.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin/mutations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Icon (emoji)">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Description">
        <input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Color">
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900" />
        </Field>
        <Field label="Rarity Tier">
          <select value={rarity} onChange={(e) => setRarity(e.target.value)} className={inputCls}>
            {rarities.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Income %">
          <input type="number" value={incomePct} onChange={(e) => setIncomePct(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Attack %">
          <input type="number" value={attackPct} onChange={(e) => setAttackPct(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Tower Dmg %">
          <input type="number" value={towerPct} onChange={(e) => setTowerPct(Number(e.target.value))} className={inputCls} />
        </Field>
      </div>

      <Field label="Drop Chance (0–1, chance to roll when a card ascends)">
        <input
          type="number"
          step="0.001"
          value={dropChance}
          onChange={(e) => setDropChance(Number(e.target.value))}
          className={inputCls}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : isNew ? "Create Mutation" : "Save Changes"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-cyan-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
