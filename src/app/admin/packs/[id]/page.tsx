import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PackForm } from "@/components/admin/PackForm";

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: pack }, { data: rarities }, { data: currencies }] = await Promise.all([
    supabase.from("packs").select("*").eq("id", id).single(),
    supabase.from("rarities").select("*").order("sort_order"),
    supabase.from("currencies").select("*").eq("active", true),
  ]);

  if (!pack) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Pack</h1>
      <PackForm pack={pack} rarities={rarities ?? []} currencies={currencies ?? []} />
    </div>
  );
}
