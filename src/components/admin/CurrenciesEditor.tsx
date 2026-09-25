"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CurrencyRow } from "@/lib/types/database";

export function CurrenciesEditor({ currencies }: { currencies: CurrencyRow[] }) {
  const router = useRouter();
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🪙");

  async function addCurrency(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("currencies").insert({ id: newId, name: newName, icon: newIcon });
    if (error) {
      alert(error.message);
      return;
    }
    setNewId("");
    setNewName("");
    router.refresh();
  }

  async function toggle(c: CurrencyRow) {
    const supabase = createClient();
    await supabase.from("currencies").update({ active: !c.active }).eq("id", c.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addCurrency} className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <input required placeholder="id (e.g. shards)" value={newId} onChange={(e) => setNewId(e.target.value)} className={inputCls} />
        <input required placeholder="Display Name" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} />
        <input placeholder="Icon" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className={inputCls} />
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-black">
          + Add Currency
        </button>
      </form>

      <div className="space-y-1.5">
        {currencies.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-sm">
              {c.icon} {c.name} <span className="text-xs text-zinc-500">({c.id})</span>
            </p>
            <button onClick={() => toggle(c)} className="text-xs text-zinc-400">
              {c.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs";
