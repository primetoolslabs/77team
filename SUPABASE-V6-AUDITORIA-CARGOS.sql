-- ============================================================
-- 77 TEAM MANAGER - SUPABASE V6 AUDITORIA / CARGOS
-- Execute no SQL Editor antes de publicar esta versão.
-- Idempotente: pode executar mais de uma vez.
-- ============================================================

-- Auditoria compatível com bancos criados nas versões anteriores.
alter table public.audit
  add column if not exists actor_id uuid references auth.users(id),
  add column if not exists action text,
  add column if not exists details text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists audit_actor_id_idx on public.audit(actor_id);

-- Perfil.
alter table public.profiles enable row level security;
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.current_access_role() in ('dev','leadership')
);

drop policy if exists "profiles_dev_insert" on public.profiles;
create policy "profiles_dev_insert"
on public.profiles for insert to authenticated
with check (public.current_access_role() = 'dev');

drop policy if exists "profiles_dev_update" on public.profiles;
create policy "profiles_dev_update"
on public.profiles for update to authenticated
using (public.current_access_role() = 'dev')
with check (public.current_access_role() = 'dev');

-- Matriz de Cargos e Permissões.
alter table public.role_permissions enable row level security;

drop policy if exists "role_permissions_authenticated_read" on public.role_permissions;
create policy "role_permissions_authenticated_read"
on public.role_permissions for select to authenticated
using (true);

drop policy if exists "role_permissions_dev_insert" on public.role_permissions;
create policy "role_permissions_dev_insert"
on public.role_permissions for insert to authenticated
with check (public.current_access_role() = 'dev');

drop policy if exists "role_permissions_dev_update" on public.role_permissions;
create policy "role_permissions_dev_update"
on public.role_permissions for update to authenticated
using (public.current_access_role() = 'dev')
with check (public.current_access_role() = 'dev');

drop policy if exists "role_permissions_dev_delete" on public.role_permissions;
create policy "role_permissions_dev_delete"
on public.role_permissions for delete to authenticated
using (public.current_access_role() = 'dev');

-- Auditoria.
alter table public.audit enable row level security;

drop policy if exists "audit_authenticated_insert" on public.audit;
create policy "audit_authenticated_insert"
on public.audit for insert to authenticated
with check (actor_id = auth.uid());

drop policy if exists "audit_admin_read" on public.audit;
create policy "audit_admin_read"
on public.audit for select to authenticated
using (public.current_access_role() in ('dev','leadership'));

-- Permissões operacionais essenciais.
insert into public.role_permissions(role,permission_key,enabled) values
('staff','access_home',true),
('staff','access_staff',true),
('staff','character_view',true),
('staff','character_edit',true),
('staff','presence_register',true),
('staff','presence_edit',true),
('staff','payments_manage',true),
('staff','events_manage',true),
('leadership','access_home',true),
('leadership','access_staff',true),
('leadership','access_admin',true),
('leadership','character_view',true),
('leadership','character_edit',true),
('leadership','presence_register',true),
('leadership','presence_edit',true),
('leadership','payments_manage',true),
('leadership','events_manage',true)
on conflict (role,permission_key)
do nothing;

notify pgrst, 'reload schema';

-- Diagnóstico final.
select
  p.access_role,
  count(*) filter (where rp.enabled = true) as permissoes_ativas
from public.profiles p
left join public.role_permissions rp on rp.role = p.access_role
where p.active = true
group by p.access_role
order by p.access_role;


-- ============================================================
-- V6.2 - DEV PODE ALTERAR QUALQUER CARGO DE ACESSO
-- ============================================================

-- Permite que uma conta seja rebaixada para member (sem acesso administrativo).
alter table public.profiles
  drop constraint if exists profiles_access_role_check;

alter table public.profiles
  add constraint profiles_access_role_check
  check (access_role in ('dev','leadership','staff','member'));

create or replace function public.dev_set_access_role(
  target_user_id uuid,
  new_access_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_role text;
  updated_profile public.profiles;
begin
  select p.access_role
    into actor_role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
    and p.status = 'approved';

  if actor_role is distinct from 'dev' then
    raise exception 'Somente DEV pode alterar cargos de acesso'
      using errcode = '42501';
  end if;

  if new_access_role not in ('dev','leadership','staff','member') then
    raise exception 'Cargo de acesso inválido'
      using errcode = '22023';
  end if;

  update public.profiles
     set access_role = new_access_role,
         updated_at = now()
   where id = target_user_id
   returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Perfil não encontrado'
      using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.dev_set_access_role(uuid,text) from public;
grant execute on function public.dev_set_access_role(uuid,text) to authenticated;

notify pgrst, 'reload schema';
