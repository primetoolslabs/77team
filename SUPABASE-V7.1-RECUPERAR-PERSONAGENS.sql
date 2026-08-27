-- ============================================================
-- 77 TEAM MANAGER V7.1 - RECUPERAR PERSONAGENS / RLS
-- Execute no Supabase > SQL Editor.
-- Seguro para executar mais de uma vez.
-- ============================================================

alter table public.characters enable row level security;

-- Qualquer usuário administrativo autenticado pode visualizar personagens.
drop policy if exists "characters_authenticated_read" on public.characters;
create policy "characters_authenticated_read"
on public.characters
for select
to authenticated
using (true);

-- DEV, Liderança e Staff podem cadastrar personagens.
drop policy if exists "characters_staff_insert" on public.characters;
create policy "characters_staff_insert"
on public.characters
for insert
to authenticated
with check (
  public.current_access_role() in ('dev','leadership','staff')
);

-- DEV, Liderança e Staff podem editar personagens.
drop policy if exists "characters_staff_update" on public.characters;
create policy "characters_staff_update"
on public.characters
for update
to authenticated
using (
  public.current_access_role() in ('dev','leadership','staff')
)
with check (
  public.current_access_role() in ('dev','leadership','staff')
);

-- Exclusão permanece administrativa.
drop policy if exists "characters_staff_delete" on public.characters;
create policy "characters_staff_delete"
on public.characters
for delete
to authenticated
using (
  public.current_access_role() in ('dev','leadership','staff')
);

notify pgrst, 'reload schema';

select
  count(*) as characters_total,
  count(*) filter (where active=true) as characters_active
from public.characters;
