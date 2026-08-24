-- ============================================================
-- 77 TEAM MANAGER - SUPABASE MIGRAÇÃO V4
-- Não usa ON CONFLICT. Apenas garante os campos legacy_id.
-- ============================================================

alter table public.characters
  add column if not exists legacy_id text;

alter table public.attendance
  add column if not exists legacy_id text,
  add column if not exists legacy_member_id text,
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

alter table public.payments
  add column if not exists legacy_id text,
  add column if not exists payment_type text not null default '',
  add column if not exists quantity bigint not null default 0,
  add column if not exists nickname text not null default '',
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

alter table public.events
  add column if not exists legacy_id text,
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

-- Índices comuns apenas para acelerar busca por legacy_id.
create index if not exists characters_legacy_lookup
  on public.characters(legacy_id);

create index if not exists attendance_legacy_lookup
  on public.attendance(legacy_id);

create index if not exists payments_legacy_lookup
  on public.payments(legacy_id);

create index if not exists events_legacy_lookup
  on public.events(legacy_id);

notify pgrst, 'reload schema';

select
  (select count(*) from public.characters) as characters,
  (select count(*) from public.attendance) as attendance,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.events) as events;
