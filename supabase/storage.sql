-- ============================================================================
-- ANIME INFINITE — STORAGE SETUP
-- ============================================================================
-- Run AFTER schema.sql. Creates the `game-assets` bucket used by the Admin
-- Panel's image uploader (characters, packs, events, mutation icons, etc.)
-- and locks writes to admins only, while keeping reads public so the game
-- can display images to every player.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;

create policy "game_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'game-assets');

create policy "game_assets_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'game-assets' and public.is_admin());

create policy "game_assets_admin_update"
  on storage.objects for update
  using (bucket_id = 'game-assets' and public.is_admin());

create policy "game_assets_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'game-assets' and public.is_admin());
