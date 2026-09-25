"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader } from "./ImageUploader";
import type { PackRow, CharacterRow, Rarity, CurrencyRow } from "@/lib/types/database";

export function PackForm({
  pack,
  rarities,
  currencies,
}: {
  pack: PackRow | null;
  rarities: Rarity[];
  currencies: CurrencyRow[];
}) {
  const router = useRouter();
  const isNew = !pack;

  const [name, setName] = useState(pack?.name ?? "");
  const [description, setDescription] = useState(pack?.description ?? "");
  const [image, setImage] = useState<string | null>(pack?.image_url ?? null);
  const [cost, setCost] = useState(pack?.cost ?? 100);
  const [currencyId, setCurrencyId] = useState(pack?.currency_id ?? currencies[0]?.id ?? "coins");
  const [minRarity, setMinRarity] = useState(pack?.min_rarity ?? rarities[0]?.id ?? "");
  const [maxRarity, setMaxRarity] = useState(pack?.max_rarity ?? rarities[rarities.length - 1]?.id ?? "");
  const [isLimited, setIsLimited] = useState(pack?.is_limited ?? false);
  const [startAt, setStartAt] = useState(toLocalInput(pack?.start_at));
  const [endAt, setEndAt] = useState(toLocalInput(pack?.end_at));
  const [active, setActive] = useState(pack?.active ?? true);
  const [sortOrder, setSortOrder] = useState(pack?.sort_order ?? 0);

  const [allCharacters, setAllCharacters] = useState<(CharacterRow & { rarity_row: Rarity })[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({}); // character_id -> drop rate %
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: chars } = await supabase
        .from("characters")
        .select("*, rarity_row:rarities(*)")
        .eq("active", true)
        .order("character_name");
      setAllCharacters((chars as unknown as (CharacterRow & { rarity_row: Rarity })[]) ?? []);

      if (pack) {
        const { data: pc } = await supabase.from("pack_characters").select("*").eq("pack_id", pack.id);
        const w: Record<string, number> = {};
        pc?.forEach((row) => (w[row.character_id] = row.weight));
        setWeights(w);
      }
    })();
  }, [pack]);

  const total = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);
  const isValid = Object.keys(weights).length === 0 || Math.abs(total - 100) < 0.01;

  function setWeight(characterId: string, value: string) {
    const num = value === "" ? 0 : Number(value);
    setWeights((prev) => {
      const next = { ...prev };
      if (num <= 0) delete next[characterId];
      else next[characterId] = num;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError(`Drop rates must total 100% (currently ${total.toFixed(1)}%).`);
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || null,
      image_url: image,
      cost,
      currency_id: currencyId,
      min_rarity: minRarity || null,
      max_rarity: maxRarity || null,
      is_limited: isLimited,
      start_at: isLimited && startAt ? new Date(startAt).toISOString() : null,
      end_at: isLimited && endAt ? new Date(endAt).toISOString() : null,
      active,
      sort_order: sortOrder,
    };

    const supabase = createClient();
    let packId = pack?.id;

    if (isNew) {
      const { data, error } = await supabase.from("packs").insert(payload).select("id").single();
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
      packId = data.id;
    } else {
      const { error } = await supabase.from("packs").update(payload).eq("id", pack!.id);
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }

    // Replace pack_characters wholesale with current selection
    await supabase.from("pack_characters").delete().eq("pack_id", packId);
    const rows = Object.entries(weights).map(([character_id, weight]) => ({
      pack_id: packId,
      character_id,
      weight,
    }));
    if (rows.length > 0) {
      const { error: pcErr } = await supabase.from("pack_characters").insert(rows);
      if (pcErr) {
        setSaving(false);
        setError(pcErr.message);
        return;
      }
    }

    setSaving(false);
    router.push("/admin/packs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <ImageUploader folder="packs" value={image} onUploaded={setImage} label="Pack Artwork" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Sort Order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Cost">
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Currency">
          <select value={currencyId} onChange={(e) => setCurrencyId(e.target.value)} className={inputCls}>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Active">
          <select
            value={active ? "1" : "0"}
            onChange={(e) => setActive(e.target.value === "1")}
            className={inputCls}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Min Rarity">
          <select value={minRarity} onChange={(e) => setMinRarity(e.target.value)} className={inputCls}>
            {rarities.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max Rarity">
          <select value={maxRarity} onChange={(e) => setMaxRarity(e.target.value)} className={inputCls}>
            {rarities.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={isLimited} onChange={(e) => setIsLimited(e.target.checked)} />
        Limited-time pack
      </label>

      {isLimited && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="End">
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold">Possible Rewards</p>
          <p className={`text-sm font-bold ${isValid ? "text-emerald-400" : "text-red-400"}`}>
            Total: {total.toFixed(1)}%
          </p>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
          {allCharacters.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-900">
              <span
                className="w-12 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-bold"
                style={{ color: c.rarity_row?.color_hex, backgroundColor: `${c.rarity_row?.color_hex}22` }}
              >
                {c.rarity}
              </span>
              <span className="flex-1 truncate text-sm">{c.character_name}</span>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={weights[c.id] ?? ""}
                onChange={(e) => setWeight(c.id, e.target.value)}
                className="w-20 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-sm"
              />
              <span className="w-4 text-xs text-zinc-500">%</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : isNew ? "Create Pack" : "Save Changes"}
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

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
