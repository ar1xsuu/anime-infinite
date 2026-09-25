import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CharacterForm } from "@/components/admin/CharacterForm";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: character }, { data: rarities }] = await Promise.all([
    supabase.from("characters").select("*").eq("id", id).single(),
    supabase.from("rarities").select("*").order("sort_order"),
  ]);

  if (!character) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Character</h1>
      <CharacterForm character={character} rarities={rarities ?? []} />
    </div>
  );
}
