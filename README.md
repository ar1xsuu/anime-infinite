# Anime Infinite

A mobile-first anime card collector / idle RPG / gacha / tower-climber, built
so that **every piece of game content — characters, packs, rarities,
mutations, tower floors, missions, events — is data in Supabase, editable
from the in-app Admin Panel.** Nothing about a character, a drop rate, or a
tower floor is hardcoded in the frontend.

This is Phase 1 + Phase 2 from the build plan: the full playable core loop
(pull → upgrade → mutate → team → tower → offline income) plus the Admin
Panel for Characters, Packs, Mutations, Tower, Events, Rarities, Missions,
Abilities, Currencies and Players.

---

## 1. Architecture, and why

- **Next.js 15 (App Router) + TypeScript + Tailwind** — mobile-first UI,
  bottom tab nav, PWA-ready (manifest + safe-area handling for notches).
- **Supabase (Postgres + Auth + Storage)** — one project gives you the
  database, email/password auth, and image storage.
- **Game logic lives in Postgres, not in the frontend.** Every action that
  changes currency or cards — opening a pack, upgrading, ascending, fighting
  a tower floor, claiming offline income — is a `SECURITY DEFINER` SQL
  function (see `supabase/functions.sql`) that the client calls via
  `supabase.rpc(...)`. The client can ask "open this pack for me"; it can
  never say "give me an SSR" or "set my coins to 999999999". This is the
  standard way to make a Supabase-backed game cheat-resistant without
  standing up a separate backend server.
- **Admin writes are enforced twice.** The Admin Panel is gated by a
  server-side check (`src/app/admin/layout.tsx`), *and* every table a
  non-admin might try to write to directly has a Row Level Security policy
  requiring `is_admin()` in Postgres. Hiding the button is not the security
  boundary — the database is.
- **Central balancing config.** `game_config` (a key/value table) holds the
  upgrade-cost formula, ascension-cost formula, offline-income cap, XP
  formula, duplicate rewards, and mutation-roll chance. Tune the game's feel
  by editing rows in that table — no code changes.

---

## 2. What's included vs. what's next

**Included (Phase 1 — core game):** Auth, Home dashboard, Pack opening with
reveal animation, card Upgrade/Ascend, Team builder with tag bonuses, Tower
with battle sequence, Collection with filters/search, offline income,
daily missions.

**Included (Phase 2 — Admin Panel):** Characters (create/edit/delete/
duplicate + image upload), Packs (full editor incl. drop-rate-must-equal-100%
validation), Mutations, Tower floors (inline-editable), Events (with
featured-character picker), Rarities, Missions, Abilities, Currencies,
Players (search + grant coins/gems/cards, set tower floor, reset player).

**Not built yet (Phase 3/4 per the original plan):** fancier pack-opening
animation polish, 5-slot teams (schema supports it — `teams.max_slots` — the
UI currently shows whatever `max_slots` is, so raising it to 5 for a player
is a data change, not a code change), leaderboards, trading, guilds, PvP.

---

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
values (**Project Settings → API** in the Supabase dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Both are safe to expose to the browser — the anon key only ever acts within
whatever Row Level Security allows.

---

## 4. Connect Supabase (one-time setup)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run these three files **in order** (copy-paste
   each one's contents and hit Run):
   1. `supabase/schema.sql` — tables, RLS policies, seed rarities/currencies
   2. `supabase/functions.sql` — all gameplay RPC functions
   3. `supabase/storage.sql` — creates the `game-assets` Storage bucket used
      by the Admin Panel's image uploader
3. Optional but recommended for trying the game immediately: run
   `supabase/seed.sql` too — it populates demo characters (Luffy, Goku,
   Naruto, Gojo, etc. with placeholder art), packs, mutations, 30 tower
   floors, and daily missions.
4. Copy your Project URL and anon key into `.env.local` as above.

---

## 5. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Resize your browser to a phone width (or open
dev tools' device toolbar) — the UI is designed portrait-first.

---

## 6. Create your first account, then make it an admin

1. Go to `/signup` and create an account normally (this is how every player
   signs up — there's no separate admin signup flow).
2. In the Supabase dashboard, open **Table Editor → profiles**, find your row
   (matched by the username you chose), and flip `is_admin` to `true`.
3. Sign out and back in (or just refresh) — you'll now see `/admin` is
   reachable, and the game will treat you as a normal player *and* an admin
   at the same time (your player account still has its own coins/gems/cards).

---

## 7. Upload an image

Anywhere you see an image box with a file picker in the Admin Panel
(Characters, Packs, Events, and mutation icons accept emoji instead), pick a
PNG/JPG/WEBP. It uploads straight to the `game-assets` Supabase Storage
bucket and the public URL is saved on that row automatically — you never
type a URL by hand.

---

## 8. Add your first character

1. Go to `/admin/characters` → **+ New Character**.
2. Fill in name, anime/series, description, pick a rarity, upload artwork.
3. Leave Attack/HP/Income/Crit Rate/Level Cap blank to inherit the rarity's
   defaults (edit those defaults anytime at `/admin/rarities`), or set them
   per-character to make one card stand out.
4. Add tags (comma-separated, e.g. `Shonen, Swordsman`) — these feed the
   Team tag-bonus system (team bonus *rules*, like "3 Shonen → +10% income",
   live in the `team_bonus_rules` table, editable via the Supabase Table
   Editor for now).
5. Save. The character is now eligible to appear in any pack you add it to.

---

## 9. Create your first pack

1. Go to `/admin/packs` → **+ New Pack**.
2. Set name, cost, currency, min/max rarity, upload pack art.
3. In **Possible Rewards**, type a drop-rate percentage next to each
   character you want in the pack. The total must equal **100%** — the page
   shows a running total in green/red and blocks saving until it balances.
4. Save. The pack immediately appears in-game at `/packs` for every player
   (respecting Active/Start/End if you set a limited window).

---

## 10. Everyday balancing

- **Rarity tuning** (`/admin/rarities`): base stats, level cap, ascension
  tier count/multiplier, color, glow — per rarity, inherited by any
  character that doesn't override it.
- **Formulas** (upgrade cost, ascension cost, offline income cap, XP curve,
  duplicate rewards, mutation-roll chance): edit rows in the `game_config`
  table via the Supabase Table Editor. Each row's `description` column
  explains its shape.
- **Mutations** (`/admin/mutations`): stat modifiers are just three % fields
  today (income/attack/tower damage) — extend `stat_modifiers` (jsonb) and
  the `get_card_power` SQL function together if you add new effect types.

---

## 11. Project structure

```
supabase/
  schema.sql        - tables + RLS policies
  functions.sql      - all gameplay RPCs (pack open, upgrade, ascend, battle...)
  seed.sql           - demo characters/packs/mutations/tower/missions
  storage.sql        - image bucket + policies
src/
  app/
    (game)/          - Home, Packs, Team, Tower, Collection (bottom-nav group)
    admin/           - Admin Panel (server-guarded layout + per-content pages)
    login/, signup/
  components/        - CardTile, RarityBadge, BottomNav, CurrencyBar...
  components/admin/  - forms + inline editors for each admin content type
  lib/
    supabase/        - browser + server Supabase clients, middleware
    game/api.ts       - every game-screen data call in one place
    types/            - hand-written DB row types (swap for generated types
                         once your project is live - see comment in the file)
```

---

## 12. Known simplifications (prototype-scope, by design)

- Team bonus *rules* (which tag combos grant what) are edited via the
  Supabase Table Editor rather than a dedicated admin UI — add one if this
  becomes a frequent edit.
- Abilities exist as a data model and are linked to characters in the schema
  (`character_abilities`), but the battle calculation currently only uses
  attack/HP/income/tower-damage-% from rarity + level + ascension +
  mutations — wiring individual ability effects into `fight_floor` is a
  natural next step once you've decided how elaborate combat should get.
- Team size is read from `teams.max_slots` (defaults to 3); there's no admin
  UI to bulk-change it yet — update it per-player or via a migration when
  you're ready to expand to 5.
