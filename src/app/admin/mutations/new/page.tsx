import { createClient } from "@/lib/supabase/server";
import { MutationForm } from "@/components/admin/MutationForm";

export default async function NewMutationPage() {
  const supabase = await createClient();
  const { data: rarities } = await supabase.from("rarities").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Mutation</h1>
      <MutationForm mutation={null} rarities={rarities ?? []} />
    </div>
  );
}
