import { createClient } from "@/lib/supabase/server";
import { PlayersEditor } from "@/components/admin/PlayersEditor";

export default async function AdminPlayersPage() {
  const supabase = await createClient();
  const { data: players } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Players</h1>
      <PlayersEditor players={players ?? []} />
    </div>
  );
}
