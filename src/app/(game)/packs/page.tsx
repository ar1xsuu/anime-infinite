"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getActivePacks, getRarities, getProfile, openPack } from "@/lib/game/api";
import type { PackRow, Rarity, ProfileRow } from "@/lib/types/database";
import { RarityBadge } from "@/components/RarityBadge";
import { formatNumber } from "@/lib/format";

type PullResult = Awaited<ReturnType<typeof openPack>>;

export default function PacksPage() {
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [opening, setOpening] = useState<PackRow | null>(null);
  const [result, setResult] = useState<PullResult | null>(null);
  const [phase, setPhase] = useState<"shaking" | "revealed">("shaking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [p, r, prof] = await Promise.all([getActivePacks(), getRarities(), getProfile()]);
      setPacks(p);
      setRarities(r);
      setProfile(prof);
    })();
  }, []);

  function rarityOf(id: string | null) {
    return rarities.find((r) => r.id === id);
  }

  async function handleOpen(pack: PackRow) {
    setError(null);
    setOpening(pack);
    setResult(null);
    setPhase("shaking");
    try {
      const res = await openPack(pack.id);
      // brief shake before the reveal — keeps it satisfying without dragging on
      setTimeout(() => {
        setResult(res);
        setPhase("revealed");
      }, 700);
      const prof = await getProfile();
      setProfile(prof);
    } catch (e) {
      setOpening(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function handleSkip() {
    setPhase("revealed");
  }

  function handleClose() {
    setOpening(null);
    setResult(null);
  }

  async function handlePullAgain() {
    if (!opening) return;
    await handleOpen(opening);
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="pt-2 text-lg font-bold">Packs</h1>
      {profile && (
        <div className="flex gap-2 text-xs text-zinc-400">
          <span>🪙 {formatNumber(profile.coins)}</span>
          <span>💎 {formatNumber(profile.gems)}</span>
          <span>🎫 {profile.pack_tickets}</span>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {packs.map((pack) => {
          const min = rarityOf(pack.min_rarity);
          const max = rarityOf(pack.max_rarity);
          return (
            <div key={pack.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {pack.image_url && (
                    <Image src={pack.image_url} alt={pack.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold">{pack.name}</p>
                    {pack.is_limited && (
                      <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-300">
                        LIMITED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{pack.description}</p>
                  {min && max && (
                    <div className="mt-1 flex gap-1">
                      <RarityBadge rarity={min} />
                      <span className="text-xs text-zinc-600">–</span>
                      <RarityBadge rarity={max} />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleOpen(pack)}
                className="mt-3 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-black active:scale-95"
              >
                OPEN — {pack.cost} {pack.currency_id === "gems" ? "💎" : pack.currency_id === "coins" ? "🪙" : "🎫"}
              </button>
            </div>
          );
        })}
        {packs.length === 0 && (
          <p className="pt-8 text-center text-sm text-zinc-500">No packs available right now.</p>
        )}
      </div>

      {opening && (
        <PackOpenOverlay
          pack={opening}
          phase={phase}
          result={result}
          rarity={result ? rarityOf(result.rarity) : undefined}
          onSkip={handleSkip}
          onClose={handleClose}
          onPullAgain={handlePullAgain}
        />
      )}
    </div>
  );
}

function PackOpenOverlay({
  pack,
  phase,
  result,
  rarity,
  onSkip,
  onClose,
  onPullAgain,
}: {
  pack: PackRow;
  phase: "shaking" | "revealed";
  result: PullResult | null;
  rarity: Rarity | undefined;
  onSkip: () => void;
  onClose: () => void;
  onPullAgain: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-6">
      {phase === "shaking" || !result ? (
        <div className="flex flex-col items-center">
          <div className="relative h-40 w-40 animate-bounce overflow-hidden rounded-2xl bg-zinc-800">
            {pack.image_url && <Image src={pack.image_url} alt="" fill className="object-cover" />}
          </div>
          <p className="mt-4 text-sm text-zinc-400">Opening {pack.name}…</p>
          <button onClick={onSkip} className="mt-6 text-xs text-zinc-500 underline">
            Skip
          </button>
        </div>
      ) : (
        <div className="pop-in flex w-full max-w-xs flex-col items-center">
          {rarity && (
            <p
              className="shine-text mb-2 text-2xl font-black tracking-wide"
              style={{ color: rarity.color_hex }}
            >
              {rarity.name.toUpperCase()}
            </p>
          )}
          <div
            className="relative aspect-[3/4] w-52 overflow-hidden rounded-2xl bg-zinc-800"
            style={{ boxShadow: rarity?.glow ? `0 0 30px ${rarity.color_hex}88` : undefined }}
          >
            {result.image_url && (
              <Image src={result.image_url} alt={result.character_name} fill className="object-cover" />
            )}
            <span
              className={`absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold ${
                result.is_new ? "bg-cyan-500 text-black" : "bg-zinc-700 text-zinc-200"
              }`}
            >
              {result.is_new ? "NEW" : "DUPLICATE"}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold">{result.character_name}</p>
          <p className="text-xs text-zinc-500">{result.anime}</p>

          <div className="mt-6 flex w-full gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-200"
            >
              Done
            </button>
            <button
              onClick={onPullAgain}
              className="flex-1 rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-black active:scale-95"
            >
              Open Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
