-- ============================================================
-- 77 TEAM MANAGER - V7 SQL COMPLETO / IDempotente
-- Inclui cargos V6 + correções V6.4 + backend V7.
-- ============================================================

create or replace function public.current_access_role()
returns text
language sql
stable
security definer
set search_path=public,auth
as $$
  select coalesce((select access_role from public.profiles where id=auth.uid() and active=true limit 1),'member');
$$;

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


-- V6.4 - AUDITORIA DE CARGOS / DEV
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
  old_role text;
  updated_profile public.profiles;
begin
  select p.access_role into actor_role
  from public.profiles p
  where p.id = auth.uid() and p.active = true and p.status = 'approved';

  if actor_role is distinct from 'dev' then
    raise exception 'Somente DEV pode alterar cargos de acesso' using errcode='42501';
  end if;

  if new_access_role not in ('dev','leadership','staff','member') then
    raise exception 'Cargo de acesso inválido' using errcode='22023';
  end if;

  select access_role into old_role from public.profiles where id=target_user_id;

  update public.profiles
     set access_role=new_access_role, updated_at=now()
   where id=target_user_id
   returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Perfil não encontrado' using errcode='P0002';
  end if;

  insert into public.audit(actor_id,action,details,created_at)
  values(auth.uid(),'cargo de acesso alterado',
         coalesce(old_role,'member') || ' -> ' || new_access_role || ' | alvo=' || target_user_id::text,
         now());

  return updated_profile;
end;
$$;

revoke all on function public.dev_set_access_role(uuid,text) from public;
grant execute on function public.dev_set_access_role(uuid,text) to authenticated;
notify pgrst, 'reload schema';


-- ============================================================
-- 77 TEAM MANAGER - V7 AUDITORIA TOTAL / SUPABASE PRINCIPAL
-- Execute uma vez no SQL Editor. Idempotente.
-- ============================================================

-- Perfil: campos usados pela aba Meu Perfil.
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists discord text,
  add column if not exists whatsapp text,
  add column if not exists birth_date date,
  add column if not exists bio text,
  add column if not exists avatar_data_url text,
  add column if not exists progression jsonb not null default '{}'::jsonb;

-- Configurações privadas autenticadas.
create table if not exists public.app_settings(
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select to authenticated using (true);
drop policy if exists app_settings_dev_write on public.app_settings;
create policy app_settings_dev_write on public.app_settings for all to authenticated
using (public.current_access_role()='dev') with check (public.current_access_role()='dev');

-- Configurações públicas sem segredos (tema, manutenção, login etc.).
create table if not exists public.public_settings(
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.public_settings enable row level security;
drop policy if exists public_settings_read on public.public_settings;
create policy public_settings_read on public.public_settings for select to anon, authenticated using (true);
drop policy if exists public_settings_write on public.public_settings;
create policy public_settings_write on public.public_settings for all to authenticated
using (public.current_access_role()='dev') with check (public.current_access_role()='dev');

-- Registros auxiliares: notificações, chat, suporte, RT, sessões, backups, XP.
create table if not exists public.app_records(
  record_key text primary key,
  kind text not null,
  legacy_id text not null,
  owner_uid uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_records_kind_idx on public.app_records(kind);
create index if not exists app_records_owner_idx on public.app_records(owner_uid);
alter table public.app_records enable row level security;
drop policy if exists app_records_read on public.app_records;
create policy app_records_read on public.app_records for select to authenticated
using (owner_uid=auth.uid() or public.current_access_role() in ('dev','leadership','staff') or kind in ('notification','notification_read'));
drop policy if exists app_records_insert on public.app_records;
create policy app_records_insert on public.app_records for insert to authenticated
with check (created_by=auth.uid() and (owner_uid is null or owner_uid=auth.uid() or public.current_access_role() in ('dev','leadership','staff')));
drop policy if exists app_records_update on public.app_records;
create policy app_records_update on public.app_records for update to authenticated
using (owner_uid=auth.uid() or public.current_access_role() in ('dev','leadership','staff'))
with check (owner_uid=auth.uid() or public.current_access_role() in ('dev','leadership','staff'));
drop policy if exists app_records_delete on public.app_records;
create policy app_records_delete on public.app_records for delete to authenticated
using (owner_uid=auth.uid() or public.current_access_role() in ('dev','leadership','staff'));

-- Snapshot público da Home.
create table if not exists public.public_snapshots(
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.public_snapshots enable row level security;
drop policy if exists public_snapshots_read on public.public_snapshots;
create policy public_snapshots_read on public.public_snapshots for select to anon, authenticated using (true);
drop policy if exists public_snapshots_write on public.public_snapshots;
create policy public_snapshots_write on public.public_snapshots for all to authenticated
using (public.current_access_role() in ('dev','leadership','staff'))
with check (public.current_access_role() in ('dev','leadership','staff'));

-- Atualização segura do próprio perfil; não permite alterar access_role.
create or replace function public.update_my_profile(
  new_name text,
  new_display_name text,
  new_discord text,
  new_whatsapp text,
  new_birth_date date,
  new_bio text,
  new_avatar_data_url text
) returns public.profiles
language plpgsql security definer set search_path=public,auth as $$
declare result public.profiles;
begin
  update public.profiles set
    name=left(coalesce(new_name,name),120),
    display_name=left(coalesce(new_display_name,display_name,name),120),
    discord=left(coalesce(new_discord,''),120),
    whatsapp=left(coalesce(new_whatsapp,''),80),
    birth_date=new_birth_date,
    bio=left(coalesce(new_bio,''),1000),
    avatar_data_url=new_avatar_data_url,
    updated_at=now()
  where id=auth.uid() returning * into result;
  if result.id is null then raise exception 'Perfil não encontrado' using errcode='P0002'; end if;
  return result;
end;$$;
revoke all on function public.update_my_profile(text,text,text,text,date,text,text) from public;
grant execute on function public.update_my_profile(text,text,text,text,date,text,text) to authenticated;

-- Storage público para imagens de atendimento e personalização.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('team-assets','team-assets',true,15728640,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=15728640,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists team_assets_read on storage.objects;
create policy team_assets_read on storage.objects for select to anon, authenticated using (bucket_id='team-assets');
drop policy if exists team_assets_insert on storage.objects;
create policy team_assets_insert on storage.objects for insert to authenticated with check (bucket_id='team-assets');
drop policy if exists team_assets_update on storage.objects;
create policy team_assets_update on storage.objects for update to authenticated using (bucket_id='team-assets') with check (bucket_id='team-assets');
drop policy if exists team_assets_delete on storage.objects;
create policy team_assets_delete on storage.objects for delete to authenticated using (bucket_id='team-assets' and public.current_access_role() in ('dev','leadership','staff'));

-- Perfil/roles: manter permissões atuais.
notify pgrst, 'reload schema';

select 'V7 OK' as status,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.characters) as characters,
  (select count(*) from public.role_permissions) as role_permissions;

-- Mantém o e-mail exibido em profiles sincronizado após alteração no Supabase Auth.
create or replace function public.sync_my_email(new_email text)
returns public.profiles
language plpgsql security definer set search_path=public,auth as $$
declare result public.profiles;
begin
  update public.profiles set email=lower(trim(new_email)),updated_at=now() where id=auth.uid() returning * into result;
  if result.id is null then raise exception 'Perfil não encontrado' using errcode='P0002'; end if;
  return result;
end;$$;
revoke all on function public.sync_my_email(text) from public;
grant execute on function public.sync_my_email(text) to authenticated;
notify pgrst, 'reload schema';
