import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminPacksPage() {
  const supabase = await createClient();
  const { data: packs } = await supabase.from("packs").select("*").order("sort_order");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Packs</h1>
        <Link href="/admin/packs/new" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black">
          + New Pack
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Rarity Range</th>
              <th className="p-3">Window</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {packs?.map((p) => (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="p-3 font-medium">
                  {p.name} {p.is_limited && <span className="text-fuchsia-400">•LIMITED</span>}
                </td>
                <td className="p-3 text-zinc-400">
                  {p.cost} {p.currency_id}
                </td>
                <td className="p-3 text-zinc-400">
                  {p.min_rarity} – {p.max_rarity}
                </td>
                <td className="p-3 text-xs text-zinc-500">
                  {p.start_at ? new Date(p.start_at).toLocaleDateString() : "—"} →{" "}
                  {p.end_at ? new Date(p.end_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">{p.active ? "✅" : "—"}</td>
                <td className="space-x-2 p-3 text-right">
                  <Link href={`/admin/packs/${p.id}`} className="text-cyan-400">
                    Edit
                  </Link>
                  <DeleteButton table="packs" id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
