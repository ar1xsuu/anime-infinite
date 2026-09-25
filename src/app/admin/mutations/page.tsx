import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminMutationsPage() {
  const supabase = await createClient();
  const { data: mutations } = await supabase.from("mutations").select("*").order("drop_chance");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mutations</h1>
        <Link href="/admin/mutations/new" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black">
          + New Mutation
        </Link>
      </div>

      <div className="space-y-2">
        {mutations?.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl border p-3"
            style={{ borderColor: `${m.color_hex}55`, backgroundColor: `${m.color_hex}0d` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-bold" style={{ color: m.color_hex }}>
                  {m.name} <span className="text-xs text-zinc-500">({m.rarity})</span>
                </p>
                <p className="text-xs text-zinc-400">{m.description}</p>
                <p className="text-[11px] text-zinc-500">
                  Drop chance: {(m.drop_chance * 100).toFixed(1)}% {m.active ? "" : "· inactive"}
                </p>
              </div>
            </div>
            <div className="space-x-2 text-sm">
              <Link href={`/admin/mutations/${m.id}`} className="text-cyan-400">
                Edit
              </Link>
              <DeleteButton table="mutations" id={m.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
