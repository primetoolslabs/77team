-- ============================================================
-- 77 TEAM MANAGER - SUPABASE V5 PRODUÇÃO
-- Auth + Profiles + Permissions + Audit
-- Execute no SQL Editor antes de publicar a V5.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.events enable row level security;
alter table public.audit enable row level security;
alter table public.role_permissions enable row level security;

-- Usuário autenticado lê o próprio perfil.
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_permission('access_admin'));

-- DEV/Admin podem gerenciar perfis.
drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles
for all to authenticated
using (public.has_permission('access_admin'))
with check (public.has_permission('access_admin'));

-- Leitura das permissões para usuários autenticados.
drop policy if exists "role_permissions_authenticated_read" on public.role_permissions;
create policy "role_permissions_authenticated_read" on public.role_permissions
for select to authenticated using (true);

-- Auditoria.
drop policy if exists "audit_authenticated_insert" on public.audit;
create policy "audit_authenticated_insert" on public.audit
for insert to authenticated
with check (actor_id = auth.uid());

drop policy if exists "audit_admin_read" on public.audit;
create policy "audit_admin_read" on public.audit
for select to authenticated
using (public.has_permission('audit_view'));

-- Garante permissões centrais.
insert into public.role_permissions(role,permission_key,enabled) values
('staff','character_edit',true),
('staff','presence_register',true),
('staff','presence_edit',true),
('staff','payments_manage',true),
('staff','events_manage',true),
('leadership','character_edit',true),
('leadership','presence_register',true),
('leadership','presence_edit',true),
('leadership','payments_manage',true),
('leadership','events_manage',true)
on conflict (role,permission_key) do update set enabled=excluded.enabled;

notify pgrst, 'reload schema';

select id,name,email,access_role,active,status from public.profiles order by access_role,name;
