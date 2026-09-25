import { formatNumber } from "@/lib/format";

export function CurrencyBar({
  coins,
  gems,
  tickets,
}: {
  coins: number;
  gems: number;
  tickets: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Chip icon="🪙" value={coins} label="Coins" />
      <Chip icon="💎" value={gems} label="Gems" />
      <Chip icon="🎫" value={tickets} label="Tickets" />
    </div>
  );
}

function Chip({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2">
      <span className="text-base">{icon}</span>
      <div className="leading-tight">
        <p className="text-sm font-bold">{formatNumber(value)}</p>
        <p className="text-[9px] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
