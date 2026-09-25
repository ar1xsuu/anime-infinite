import { createClient } from "@/lib/supabase/server";
import { MissionsEditor } from "@/components/admin/MissionsEditor";

export default async function AdminMissionsPage() {
  const supabase = await createClient();
  const { data: missions } = await supabase.from("missions").select("*").order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Daily Missions</h1>
      <MissionsEditor missions={missions ?? []} />
    </div>
  );
}
