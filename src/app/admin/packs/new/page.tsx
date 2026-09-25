import { createClient } from "@/lib/supabase/server";
import { PackForm } from "@/components/admin/PackForm";

export default async function NewPackPage() {
  const supabase = await createClient();
  const [{ data: rarities }, { data: currencies }] = await Promise.all([
    supabase.from("rarities").select("*").order("sort_order"),
    supabase.from("currencies").select("*").eq("active", true),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New Pack</h1>
      <PackForm pack={null} rarities={rarities ?? []} currencies={currencies ?? []} />
    </div>
  );
}
