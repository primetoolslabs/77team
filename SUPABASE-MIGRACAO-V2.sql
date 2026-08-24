-- ============================================================
-- 77 TEAM MANAGER - SUPABASE MIGRAÇÃO V2
-- Execute UMA VEZ após a Base V1.
-- ============================================================

alter table public.characters
  add column if not exists legacy_id text;

create unique index if not exists characters_legacy_id_unique
  on public.characters(legacy_id)
  where legacy_id is not null;

alter table public.attendance
  add column if not exists legacy_id text,
  add column if not exists legacy_member_id text,
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

create unique index if not exists attendance_legacy_id_unique
  on public.attendance(legacy_id)
  where legacy_id is not null;

alter table public.payments
  add column if not exists legacy_id text,
  add column if not exists payment_type text not null default '',
  add column if not exists quantity bigint not null default 0,
  add column if not exists nickname text not null default '',
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

create unique index if not exists payments_legacy_id_unique
  on public.payments(legacy_id)
  where legacy_id is not null;

alter table public.events
  add column if not exists legacy_id text,
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

create unique index if not exists events_legacy_id_unique
  on public.events(legacy_id)
  where legacy_id is not null;

-- Permissões adicionais previstas no sistema.
insert into public.role_permissions(role,permission_key,enabled)
values
 ('staff','payments_manage',true),
 ('staff','events_manage',true),
 ('staff','character_edit',true),
 ('staff','presence_register',true),
 ('staff','presence_edit',true),
 ('leadership','payments_manage',true),
 ('leadership','events_manage',true),
 ('leadership','character_edit',true),
 ('leadership','presence_register',true),
 ('leadership','presence_edit',true)
on conflict (role,permission_key)
do nothing;
