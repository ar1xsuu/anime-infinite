import { createClient } from "@/lib/supabase/server";
import { TowerFloorEditor } from "@/components/admin/TowerFloorEditor";

export default async function AdminTowerPage() {
  const supabase = await createClient();
  const { data: floors } = await supabase
    .from("tower_floors")
    .select("*, enemy:enemies(*)")
    .order("floor_number");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Tower Floors</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Edit rewards and enemy stats per floor. Changes save per-row and take effect immediately —
        no deploy needed.
      </p>
      <TowerFloorEditor floors={(floors as never) ?? []} />
    </div>
  );
}
