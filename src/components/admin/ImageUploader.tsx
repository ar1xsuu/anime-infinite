"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads to the `game-assets` Supabase Storage bucket under `folder/`.
 * Calls onUploaded(publicUrl) so the parent form can store the URL on the row.
 * Create the bucket once (see README) — public read, admin-only write via RLS.
 */
export function ImageUploader({
  folder,
  value,
  onUploaded,
  label = "Image",
}: {
  folder: string;
  value: string | null;
  onUploaded: (url: string | null) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("game-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadErr) {
      setBusy(false);
      setError(uploadErr.message);
      return;
    }
    const { data } = supabase.storage.from("game-assets").getPublicUrl(path);
    setBusy(false);
    onUploaded(data.publicUrl);
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-400">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          {value ? (
            <Image src={value} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🖼️</div>
          )}
        </div>
        <div className="space-y-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            disabled={busy}
            className="block text-xs text-zinc-400 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-xs file:text-zinc-200"
          />
          {value && (
            <button
              type="button"
              onClick={() => onUploaded(null)}
              className="text-xs text-red-400 underline"
            >
              Remove image
            </button>
          )}
          {busy && <p className="text-xs text-cyan-400">Uploading…</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
