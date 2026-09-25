import { createClient } from "@/lib/supabase/server";
import { CurrenciesEditor } from "@/components/admin/CurrenciesEditor";

export default async function AdminCurrenciesPage() {
  const supabase = await createClient();
  const { data: currencies } = await supabase.from("currencies").select("*");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Currencies</h1>
      <CurrenciesEditor currencies={currencies ?? []} />
    </div>
  );
}
