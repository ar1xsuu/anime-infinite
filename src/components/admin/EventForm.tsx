"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader } from "./ImageUploader";
import type { EventRow, CharacterRow } from "@/lib/types/database";

export function EventForm({ event }: { event: EventRow | null }) {
  const router = useRouter();
  const isNew = !event;

  const [name, setName] = useState(event?.name ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [banner, setBanner] = useState<string | null>(event?.banner_image_url ?? null);
  const [startAt, setStartAt] = useState(toLocalInput(event?.start_at));
  const [endAt, setEndAt] = useState(toLocalInput(event?.end_at));
  const [active, setActive] = useState(event?.active ?? true);

  const [allCharacters, setAllCharacters] = useState<CharacterRow[]>([]);
  const [featured, setFeatured] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: chars } = await supabase.from("characters").select("*").order("character_name");
      setAllCharacters(chars ?? []);
      if (event) {
        const { data: ec } = await supabase.from("event_characters").select("character_id").eq("event_id", event.id);
        setFeatured(new Set(ec?.map((r) => r.character_id)));
      }
    })();
  }, [event]);

  function toggleFeatured(id: string) {
    setFeatured((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || null,
      banner_image_url: banner,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      active,
    };

    const supabase = createClient();
    let eventId = event?.id;

    if (isNew) {
      const { data, error } = await supabase.from("events").insert(payload).select("id").single();
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
      eventId = data.id;
    } else {
      const { error } = await supabase.from("events").update(payload).eq("id", event!.id);
      if (error) {
        setSaving(false);
        setError(error.message);
        return;
      }
    }

    await supabase.from("event_characters").delete().eq("event_id", eventId);
    if (featured.size > 0) {
      await supabase
        .from("event_characters")
        .insert(Array.from(featured).map((character_id) => ({ event_id: eventId, character_id })));
    }

    setSaving(false);
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <ImageUploader folder="events" value={banner} onUploaded={setBanner} label="Event Banner" />

      <Field label="Event Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Description">
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start">
          <input
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End">
          <input
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-400">Featured Characters</p>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
          {allCharacters.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-zinc-900">
              <input type="checkbox" checked={featured.has(c.id)} onChange={() => toggleFeatured(c.id)} />
              {c.character_name} <span className="text-xs text-zinc-500">({c.anime})</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : isNew ? "Create Event" : "Save Changes"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-cyan-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
