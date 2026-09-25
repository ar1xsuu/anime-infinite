import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [players, characters, packs, mutations] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("characters").select("id", { count: "exact", head: true }),
    supabase.from("packs").select("id", { count: "exact", head: true }),
    supabase.from("mutations").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Players", value: players.count ?? 0 },
    { label: "Characters", value: characters.count ?? 0 },
    { label: "Packs", value: packs.count ?? 0 },
    { label: "Mutations", value: mutations.count ?? 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-2xl font-black text-cyan-400">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        Use the nav to manage Characters, Packs, Mutations, Tower floors, Events and more. Every
        change here is read live by the game — no code changes or redeploys needed.
      </p>
    </div>
  );
}
