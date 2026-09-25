import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DuplicateCharacterButton } from "@/components/admin/DuplicateCharacterButton";

export default async function AdminCharactersPage() {
  const supabase = await createClient();
  const { data: characters } = await supabase
    .from("characters")
    .select("*, rarity_row:rarities(color_hex,name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Characters</h1>
        <Link
          href="/admin/characters/new"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black"
        >
          + New Character
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Anime</th>
              <th className="p-3">Rarity</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Flags</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {characters?.map((c) => (
              <tr key={c.id} className="border-t border-zinc-800">
                <td className="p-3 font-medium">{c.character_name}</td>
                <td className="p-3 text-zinc-400">{c.anime}</td>
                <td className="p-3">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold"
                    style={{
                      color: c.rarity_row?.color_hex,
                      backgroundColor: `${c.rarity_row?.color_hex}22`,
                    }}
                  >
                    {c.rarity}
                  </span>
                </td>
                <td className="p-3 text-xs text-zinc-500">{c.tags?.join(", ")}</td>
                <td className="p-3 text-xs">
                  {c.is_limited && <span className="mr-1 text-fuchsia-400">LIMITED</span>}
                  {c.is_infinite && <span className="text-cyan-400">INFINITE</span>}
                </td>
                <td className="p-3">{c.active ? "✅" : "—"}</td>
                <td className="space-x-2 p-3 text-right">
                  <Link href={`/admin/characters/${c.id}`} className="text-cyan-400">
                    Edit
                  </Link>
                  <DuplicateCharacterButton characterId={c.id} name={c.character_name} />
                  <DeleteButton table="characters" id={c.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
