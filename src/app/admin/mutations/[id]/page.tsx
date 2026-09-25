import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/MutationForm";

export default async function EditMutationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: mutation }, { data: rarities }] = await Promise.all([
    supabase.from("mutations").select("*").eq("id", id).single(),
    supabase.from("rarities").select("*").order("sort_order"),
  ]);

  if (!mutation) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Mutation</h1>
      <MutationForm mutation={mutation} rarities={rarities ?? []} />
    </div>
  );
}
