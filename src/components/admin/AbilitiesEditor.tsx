"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AbilityRow } from "@/lib/types/database";

const EFFECT_TYPES = ["attack_flat", "income_multiplier", "tower_damage_pct", "team_buff"];

export function AbilitiesEditor({ abilities }: { abilities: AbilityRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚡");
  const [effectType, setEffectType] = useState(EFFECT_TYPES[0]);
  const [effectValue, setEffectValue] = useState(10);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("abilities")
      .insert({ name, description, icon, effect_type: effectType, effect_value: effectValue });
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setName("");
    setDescription("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ability?")) return;
    const supabase = createClient();
    await supabase.from("abilities").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(a: AbilityRow) {
    const supabase = createClient();
    await supabase.from("abilities").update({ active: !a.active }).eq("id", a.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-6">
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <input placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputCls} sm:col-span-2`}
        />
        <select value={effectType} onChange={(e) => setEffectType(e.target.value)} className={inputCls}>
          {EFFECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={effectValue}
          onChange={(e) => setEffectValue(Number(e.target.value))}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={saving}
          className="col-span-2 rounded-lg bg-cyan-500 py-2 text-sm font-bold text-black sm:col-span-6"
        >
          + Add Ability
        </button>
      </form>

      <div className="space-y-1.5">
        {abilities.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <div className="flex items-center gap-2">
              <span>{a.icon}</span>
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-[11px] text-zinc-500">
                  {a.effect_type}: {a.effect_value} — {a.description}
                </p>
              </div>
            </div>
            <div className="space-x-2 text-xs">
              <button onClick={() => toggleActive(a)} className="text-zinc-400">
                {a.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => handleDelete(a.id)} className="text-red-400">
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
