import { createClient } from "@/lib/supabase/server";
import { AbilitiesEditor } from "@/components/admin/AbilitiesEditor";

export default async function AdminAbilitiesPage() {
  const supabase = await createClient();
  const { data: abilities } = await supabase.from("abilities").select("*").order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Abilities</h1>
      <AbilitiesEditor abilities={abilities ?? []} />
    </div>
  );
}
