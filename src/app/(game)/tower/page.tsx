"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTowerFloors,
  getTowerProgress,
  getProfile,
  getTeamPower,
  fightFloor,
} from "@/lib/game/api";
import type { TowerFloorRow, EnemyRow } from "@/lib/types/database";
import type { TeamPower } from "@/lib/types/game";
import { formatNumber } from "@/lib/format";

type Floor = TowerFloorRow & { enemy: EnemyRow };
type FightResult = Awaited<ReturnType<typeof fightFloor>>;

export default function TowerPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [cleared, setCleared] = useState(0);
  const [power, setPower] = useState<TeamPower | null>(null);
  const [battling, setBattling] = useState<Floor | null>(null);
  const [battlePhase, setBattlePhase] = useState<"fighting" | "done">("fighting");
  const [battleResult, setBattleResult] = useState<FightResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const profile = await getProfile();
    const [f, progress, p] = await Promise.all([
      getTowerFloors(),
      getTowerProgress(profile.id),
      getTeamPower(profile.id),
    ]);
    setFloors(f);
    setCleared(progress.highest_floor_cleared);
    setPower(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFight(floor: Floor) {
    setBattling(floor);
    setBattlePhase("fighting");
    setBattleResult(null);
    try {
      const result = await fightFloor(floor.floor_number);
      setTimeout(() => {
        setBattleResult(result);
        setBattlePhase("done");
      }, 900);
      if (result.win) setCleared((c) => Math.max(c, floor.floor_number));
    } catch (e) {
      setBattling(null);
      alert(e instanceof Error ? e.message : "Battle failed");
    }
  }

  if (loading) return <div className="pt-20 text-center text-zinc-500">Loading the Tower…</div>;

  return (
    <div className="space-y-3 pb-4">
      <h1 className="pt-2 text-lg font-bold">🗼 Infinite Tower</h1>
      {power && (
        <p className="text-xs text-zinc-400">
          Your team power: <span className="font-bold text-zinc-200">{formatNumber(power.power)}</span>
        </p>
      )}

      <div className="space-y-2">
        {floors.map((floor) => {
          const isLocked = floor.floor_number > cleared + 1;
          const isCleared = floor.floor_number <= cleared;
          return (
            <div
              key={floor.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                floor.is_boss
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-zinc-800 bg-zinc-900"
              } ${isLocked ? "opacity-40" : ""}`}
            >
              <div>
                <p className="text-sm font-bold">
                  {floor.is_boss ? "👹 " : ""}Floor {floor.floor_number}
                  {isCleared && <span className="ml-1 text-emerald-400">✓</span>}
                </p>
                <p className="text-[11px] text-zinc-500">{floor.enemy?.name}</p>
                <p className="text-[11px] text-zinc-500">
                  Requires {formatNumber(floor.required_power)} power · +{formatNumber(floor.coin_reward)}🪙
                </p>
              </div>
              <button
                disabled={isLocked}
                onClick={() => handleFight(floor)}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isLocked ? "🔒" : isCleared ? "Replay" : "Fight"}
              </button>
            </div>
          );
        })}
      </div>

      {battling && (
        <BattleOverlay
          floor={battling}
          phase={battlePhase}
          result={battleResult}
          yourPower={power?.power ?? 0}
          onClose={() => setBattling(null)}
        />
      )}
    </div>
  );
}

function BattleOverlay({
  floor,
  phase,
  result,
  yourPower,
  onClose,
}: {
  floor: Floor;
  phase: "fighting" | "done";
  result: FightResult | null;
  yourPower: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-6">
      <div className="flex w-full max-w-xs items-center justify-between">
        <div className="text-center">
          <p className="text-2xl">⚔️</p>
          <p className="mt-1 text-lg font-black">{formatNumber(yourPower)}</p>
          <p className="text-[10px] text-zinc-500">YOUR TEAM</p>
        </div>
        <p className="text-xl font-black text-zinc-600">VS</p>
        <div className="text-center">
          <p className="text-2xl">{floor.is_boss ? "👹" : "👺"}</p>
          <p className="mt-1 text-lg font-black">{formatNumber(floor.enemy?.attack ?? 0)}</p>
          <p className="text-[10px] text-zinc-500">{floor.enemy?.name?.toUpperCase()}</p>
        </div>
      </div>

      {phase === "fighting" || !result ? (
        <p className="mt-8 animate-pulse text-sm text-zinc-400">Battling…</p>
      ) : (
        <div className="pop-in mt-8 flex flex-col items-center">
          <p className={`text-2xl font-black ${result.win ? "text-emerald-400" : "text-red-400"}`}>
            {result.win ? "VICTORY" : "DEFEAT"}
          </p>
          {result.win && (
            <div className="mt-2 text-center text-sm text-zinc-300">
              <p>+{formatNumber(result.coins_awarded)} Coins</p>
              {result.gems_awarded > 0 && <p>+{result.gems_awarded} Gems</p>}
              {result.pack_tickets_awarded > 0 && <p>+{result.pack_tickets_awarded} Pack Ticket</p>}
              {result.first_clear && <p className="text-cyan-400">First Clear Bonus!</p>}
            </div>
          )}
          <button
            onClick={onClose}
            className="mt-6 rounded-lg bg-cyan-500 px-8 py-2.5 text-sm font-bold text-black active:scale-95"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
