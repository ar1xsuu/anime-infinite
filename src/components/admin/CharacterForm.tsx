"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader } from "./ImageUploader";
import type { CharacterRow, Rarity } from "@/lib/types/database";

export function CharacterForm({
  character,
  rarities,
}: {
  character: CharacterRow | null;
  rarities: Rarity[];
}) {
  const router = useRouter();
  const isNew = !character;

  const [name, setName] = useState(character?.character_name ?? "");
  const [anime, setAnime] = useState(character?.anime ?? "");
  const [description, setDescription] = useState(character?.description ?? "");
  const [image, setImage] = useState<string | null>(character?.image_url ?? null);
  const [rarity, setRarity] = useState(character?.rarity ?? rarities[0]?.id ?? "");
  const [attack, setAttack] = useState(character?.base_attack?.toString() ?? "");
  const [hp, setHp] = useState(character?.base_hp?.toString() ?? "");
  const [income, setIncome] = useState(character?.base_income?.toString() ?? "");
  const [critRate, setCritRate] = useState(character?.crit_rate?.toString() ?? "");
  const [levelCap, setLevelCap] = useState(character?.level_cap?.toString() ?? "");
  const [tags, setTags] = useState(character?.tags?.join(", ") ?? "");
  const [mutationSlots, setMutationSlots] = useState(character?.mutation_slots ?? 1);
  const [isLimited, setIsLimited] = useState(character?.is_limited ?? false);
  const [limitedStart, setLimitedStart] = useState(toLocalInput(character?.limited_start));
  const [limitedEnd, setLimitedEnd] = useState(toLocalInput(character?.limited_end));
  const [isInfinite, setIsInfinite] = useState(character?.is_infinite ?? false);
  const [active, setActive] = useState(character?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      character_name: name,
      anime,
      description: description || null,
      image_url: image,
      rarity,
      base_attack: attack ? Number(attack) : null,
      base_hp: hp ? Number(hp) : null,
      base_income: income ? Number(income) : null,
      crit_rate: critRate ? Number(critRate) : null,
      level_cap: levelCap ? Number(levelCap) : null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      mutation_slots: mutationSlots,
      is_limited: isLimited,
      limited_start: isLimited && limitedStart ? new Date(limitedStart).toISOString() : null,
      limited_end: isLimited && limitedEnd ? new Date(limitedEnd).toISOString() : null,
      is_infinite: isInfinite,
      active,
    };

    const supabase = createClient();
    const { error } = isNew
      ? await supabase.from("characters").insert(payload)
      : await supabase.from("characters").update(payload).eq("id", character!.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin/characters");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <ImageUploader folder="characters" value={image} onUploaded={setImage} label="Character Artwork" />

      <Field label="Character Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Anime / Series">
        <input required value={anime} onChange={(e) => setAnime(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Description">
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </Field>

      <Field label="Rarity">
        <select value={rarity} onChange={(e) => setRarity(e.target.value)} className={inputCls}>
          {rarities.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} — {r.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Attack (blank = inherit rarity)">
          <input value={attack} onChange={(e) => setAttack(e.target.value)} type="number" className={inputCls} />
        </Field>
        <Field label="HP (blank = inherit rarity)">
          <input value={hp} onChange={(e) => setHp(e.target.value)} type="number" className={inputCls} />
        </Field>
        <Field label="Income/s (blank = inherit rarity)">
          <input value={income} onChange={(e) => setIncome(e.target.value)} type="number" className={inputCls} />
        </Field>
        <Field label="Crit Rate 0–1 (blank = inherit rarity)">
          <input
            value={critRate}
            onChange={(e) => setCritRate(e.target.value)}
            type="number"
            step="0.01"
            className={inputCls}
          />
        </Field>
        <Field label="Level Cap (blank = inherit rarity)">
          <input value={levelCap} onChange={(e) => setLevelCap(e.target.value)} type="number" className={inputCls} />
        </Field>
        <Field label="Mutation Slots">
          <input
            value={mutationSlots}
            onChange={(e) => setMutationSlots(Number(e.target.value))}
            type="number"
            min={0}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Tags (comma-separated)">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Shonen, Swordsman, Main Character"
          className={inputCls}
        />
      </Field>

      <div className="flex flex-wrap gap-4 text-sm">
        <Checkbox checked={isInfinite} onChange={setIsInfinite} label="♾️ Infinite character" />
        <Checkbox checked={isLimited} onChange={setIsLimited} label="Limited (event) character" />
        <Checkbox checked={active} onChange={setActive} label="Active" />
      </div>

      {isLimited && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Available From">
            <input
              type="datetime-local"
              value={limitedStart}
              onChange={(e) => setLimitedStart(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Available Until">
            <input
              type="datetime-local"
              value={limitedEnd}
              onChange={(e) => setLimitedEnd(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : isNew ? "Create Character" : "Save Changes"}
        </button>
      </div>
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

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-zinc-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
