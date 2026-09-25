import { createClient } from "@/lib/supabase/server";
import { RaritiesEditor } from "@/components/admin/RaritiesEditor";

export default async function AdminRaritiesPage() {
  const supabase = await createClient();
  const { data: rarities } = await supabase.from("rarities").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Rarities</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Every rarity&apos;s drop-related behavior (base stats, level cap, ascension math, visuals) lives
        here — nothing about rarity is hardcoded in the app.
      </p>
      <RaritiesEditor rarities={rarities ?? []} />
    </div>
  );
}
