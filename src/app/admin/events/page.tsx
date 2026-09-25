import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("*").order("start_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black">
          + New Event
        </Link>
      </div>

      <div className="space-y-2">
        {events?.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div>
              <p className="font-bold">
                {ev.name} {ev.active && <span className="text-xs text-emerald-400">● active</span>}
              </p>
              <p className="text-xs text-zinc-400">{ev.description}</p>
              <p className="text-[11px] text-zinc-500">
                {new Date(ev.start_at).toLocaleString()} → {new Date(ev.end_at).toLocaleString()}
              </p>
            </div>
            <div className="space-x-2 text-sm">
              <Link href={`/admin/events/${ev.id}`} className="text-cyan-400">
                Edit
              </Link>
              <DeleteButton table="events" id={ev.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
