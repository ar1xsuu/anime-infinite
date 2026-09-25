"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getProfile,
  getOwnedCards,
  getTeamPower,
  claimOfflineIncome,
  getTodaysMissions,
  claimMission,
  getActiveEvents,
} from "@/lib/game/api";
import type { ProfileRow, EventRow, MissionRow, PlayerMissionRow } from "@/lib/types/database";
import type { OwnedCard, TeamPower } from "@/lib/types/game";
import { CardTile } from "@/components/CardTile";
import { CurrencyBar } from "@/components/CurrencyBar";
import { formatNumber } from "@/lib/format";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [power, setPower] = useState<TeamPower | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [missions, setMissions] = useState<(PlayerMissionRow & { mission: MissionRow })[]>([]);
  const [offlineReward, setOfflineReward] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
    const [ownedCards, teamPower, activeEvents, todaysMissions] = await Promise.all([
      getOwnedCards(),
      getTeamPower(p.id),
      getActiveEvents(),
      getTodaysMissions(),
    ]);
    setCards(ownedCards);
    setPower(teamPower);
    setEvents(activeEvents);
    setMissions(todaysMissions);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCollectOffline() {
    const result = await claimOfflineIncome();
    setOfflineReward(result.coins_awarded);
    const p = await getProfile();
    setProfile(p);
  }

  async function handleClaimMission(missionId: string) {
    await claimMission(missionId);
    const todays = await getTodaysMissions();
    setMissions(todays);
    const p = await getProfile();
    setProfile(p);
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading || !profile) {
    return <div className="pt-20 text-center text-zinc-500">Loading your world…</div>;
  }

  const featured = [...cards]
    .sort((a, b) => (b.rarity?.sort_order ?? 0) - (a.rarity?.sort_order ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-5 pb-4">
      {offlineReward !== null && (
        <OfflineModal reward={offlineReward} onClose={() => setOfflineReward(null)} />
      )}

      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-zinc-500">Welcome back!</p>
          <h1 className="text-lg font-bold">{profile.username}</h1>
          <p className="text-xs text-zinc-500">Lv. {profile.level}</p>
        </div>
        <button onClick={handleSignOut} className="text-xs text-zinc-500 underline">
          Sign out
        </button>
      </header>

      <CurrencyBar coins={profile.coins} gems={profile.gems} tickets={profile.pack_tickets} />

      <button
        onClick={handleCollectOffline}
        className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-left"
      >
        <p className="text-xs font-semibold text-cyan-300">Your collection generated</p>
        <p className="text-2xl font-black text-cyan-200">
          +{power ? formatNumber(power.income_per_sec * 3600) : "0"} Coins
          <span className="ml-1 text-xs font-normal text-cyan-400">/hr · tap to collect</span>
        </p>
      </button>

      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBlock label="Income/s" value={power ? formatNumber(power.income_per_sec) : "0"} />
        <StatBlock label="Tower Floor" value={String(profile.tower_floor)} />
        <StatBlock label="Cards Owned" value={String(cards.length)} />
      </div>

      {events.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-zinc-300">🔥 Current Events</h2>
          {events.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3">
              <p className="text-sm font-bold text-fuchsia-300">{ev.name}</p>
              <p className="text-xs text-zinc-400">{ev.description}</p>
              <p className="mt-1 text-[11px] text-zinc-500">Ends {new Date(ev.end_at).toLocaleDateString()}</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-300">Featured Cards</h2>
          <Link href="/collection" className="text-xs text-cyan-400">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {featured.map((c) => (
              <CardTile
                key={c.id}
                character={c.character}
                rarity={c.rarity}
                level={c.level}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-zinc-300">Daily Missions</h2>
        <div className="space-y-2">
          {missions.map((pm) => (
            <div
              key={pm.mission_id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{pm.mission.name}</p>
                <p className="text-[11px] text-zinc-500">
                  {pm.progress}/{pm.mission.target_count} · {pm.mission.reward_coins}🪙 {pm.mission.reward_gems}💎
                </p>
              </div>
              {pm.claimed ? (
                <span className="text-xs text-zinc-600">✓ Done</span>
              ) : pm.completed ? (
                <button
                  onClick={() => handleClaimMission(pm.mission_id)}
                  className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black"
                >
                  Claim
                </button>
              ) : (
                <span className="text-xs text-zinc-600">In progress</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 pt-1">
        <QuickButton href="/packs" label="Open Packs" icon="🎁" />
        <QuickButton href="/team" label="Team" icon="🛡️" />
        <QuickButton href="/tower" label="Tower" icon="🗼" />
      </section>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-2">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function QuickButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 py-3 active:scale-95"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] font-medium text-zinc-300">{label}</span>
    </Link>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
      No cards yet — open your first pack!
    </div>
  );
}

function OfflineModal({ reward, onClose }: { reward: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6">
      <div className="pop-in w-full max-w-xs rounded-2xl border border-cyan-500/40 bg-zinc-900 p-6 text-center">
        <p className="text-sm font-bold text-cyan-300">WELCOME BACK!</p>
        <p className="mt-1 text-xs text-zinc-400">While you were away:</p>
        <p className="mt-3 text-3xl font-black text-cyan-200">+{formatNumber(reward)} Coins</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-black"
        >
          COLLECT
        </button>
      </div>
    </div>
  );
}
