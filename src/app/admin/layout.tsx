import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/characters", label: "Characters" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/admin/mutations", label: "Mutations" },
  { href: "/admin/tower", label: "Tower" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/rarities", label: "Rarities" },
  { href: "/admin/missions", label: "Missions" },
  { href: "/admin/abilities", label: "Abilities" },
  { href: "/admin/currencies", label: "Currencies" },
  { href: "/admin/players", label: "Players" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: this check runs before any admin HTML is sent, and every
  // write the admin UI makes is *also* independently blocked by RLS policies
  // (`is_admin()`) at the database level — a regular player calling the same
  // Supabase table/RPC directly is refused there too, not just hidden here.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, username")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 sm:block">
        <p className="mb-4 text-sm font-black text-cyan-400">Anime Infinite — Admin</p>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-6 block text-xs text-zinc-600 underline">
          ← Back to game
        </Link>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <nav className="flex gap-3 overflow-x-auto border-b border-zinc-800 bg-zinc-950 p-3 text-xs sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 text-zinc-300">
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
