import { createClient } from "@/lib/supabase/server";
import { CharacterForm } from "@/components/admin/CharacterForm";

export default async function NewCharacterPage() {
  const supabase = await createClient();
  const { data: rarities } = await supabase.from("rarities").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Character</h1>
      <CharacterForm character={null} rarities={rarities ?? []} />
    </div>
  );
}
