"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DuplicateCharacterButton({ characterId, name }: { characterId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDuplicate() {
    const newName = prompt("Name for the duplicate:", `${name} — Variant`);
    if (!newName) return;
    setBusy(true);
    const supabase = createClient();

    const { data: original, error: fetchErr } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (fetchErr || !original) {
      setBusy(false);
      alert(fetchErr?.message ?? "Could not load original character");
      return;
    }

    // Strip id/created_at so Postgres generates fresh ones; keep everything else.
    const { id, created_at, ...rest } = original;
    void id;
    void created_at;

    const { error: insertErr } = await supabase.from("characters").insert({
      ...rest,
      character_name: newName,
      duplicated_from: characterId,
    });

    setBusy(false);
    if (insertErr) {
      alert(insertErr.message);
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={handleDuplicate} disabled={busy} className="text-zinc-400 disabled:opacity-50">
      Duplicate
    </button>
  );
}
