"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  getOwnedCards,
  getCardPower,
  upgradeCard,
  ascendCard,
  getCardMutations,
} from "@/lib/game/api";
import type { OwnedCard, CardPower } from "@/lib/types/game";
import type { CharacterRow, Rarity, MutationRow } from "@/lib/types/database";
import { RarityBadge } from "@/components/RarityBadge";
import { formatNumber } from "@/lib/format";

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<(CharacterRow & { rarity_row: Rarity }) | null>(null);
  const [owned, setOwned] = useState<OwnedCard | null>(null);
  const [power, setPower] = useState<CardPower | null>(null);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: char, error: charErr } = await supabase
      .from("characters")
      .select("*, rarity_row:rarities(*)")
      .eq("id", params.id)
      .single();
    if (charErr || !char) {
      setLoading(false);
      return;
    }
    setCharacter(char as CharacterRow & { rarity_row: Rarity });

    const ownedCards = await getOwnedCards();
    const match = ownedCards.find((c) => c.character_id === params.id) ?? null;
    setOwned(match);

    if (match) {
      const [p, muts] = await Promise.all([getCardPower(match.id), getCardMutations(match.id)]);
      setPower(p);
      setMutations(muts.map((m) => m.mutation));
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpgrade() {
    if (!owned) return;
    setBusy(true);
    setError(null);
    try {
      await upgradeCard(owned.id, 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAscend() {
    if (!owned) return;
    setBusy(true);
    setError(null);
    try {
      await ascendCard(owned.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ascension failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="pt-20 text-center text-zinc-500">Loading card…</div>;
  if (!character) return <div className="pt-20 text-center text-zinc-500">Card not found.</div>;

  const levelCap = character.level_cap ?? character.rarity_row.max_level;
  const atCap = owned ? owned.level >= levelCap : false;
  const maxAscension = owned ? owned.ascension_level >= character.rarity_row.ascension_levels : false;

  return (
    <div className="space-y-4 pb-4">
      <button onClick={() => router.back()} className="pt-2 text-sm text-zinc-500">
        ← Back
      </button>

      <div
        className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-2xl bg-zinc-800"
        style={{ boxShadow: character.rarity_row.glow ? `0 0 24px ${character.rarity_row.color_hex}77` : undefined }}
      >
        {character.image_url && (
          <Image src={character.image_url} alt={character.character_name} fill className="object-cover" />
        )}
      </div>

      <div className="text-center">
        <div className="flex justify-center">
          <RarityBadge rarity={character.rarity_row} />
        </div>
        <h1 className="mt-1 text-xl font-bold">{character.character_name}</h1>
        <p className="text-sm text-zinc-500">{character.anime}</p>
        <p className="mt-2 text-sm text-zinc-400">{character.description}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {character.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {t}
            </span>
          ))}
        </div>
      </div>

      {!owned ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
          You don&apos;t own this card yet — find it in a pack!
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">
                Level {owned.level} / {levelCap}
              </p>
              <p className="text-xs text-zinc-500">Ascension {owned.ascension_level}</p>
            </div>
            {power && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <StatBox label="Attack" value={formatNumber(power.attack)} />
                <StatBox label="HP" value={formatNumber(power.hp)} />
                <StatBox label="Income/s" value={formatNumber(power.income)} />
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleUpgrade}
                disabled={busy || atCap}
                className="flex-1 rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-black disabled:opacity-40"
              >
                {atCap ? "Max Level" : "Upgrade"}
              </button>
              <button
                onClick={handleAscend}
                disabled={busy || !atCap || maxAscension}
                className="flex-1 rounded-lg bg-fuchsia-500 py-2.5 text-sm font-bold text-black disabled:opacity-40"
              >
                {maxAscension ? "Max Ascension" : "Ascend"}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Shards: {owned.shards} · Duplicates: {owned.duplicate_count}
            </p>
          </div>

          {mutations.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-400">Mutations</p>
              <div className="space-y-1.5">
                {mutations.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-lg border p-2"
                    style={{ borderColor: `${m.color_hex}66`, backgroundColor: `${m.color_hex}11` }}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: m.color_hex ?? undefined }}>
                        {m.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-950 py-2">
      <p className="font-bold">{value}</p>
      <p className="text-zinc-500">{label}</p>
    </div>
  );
}
