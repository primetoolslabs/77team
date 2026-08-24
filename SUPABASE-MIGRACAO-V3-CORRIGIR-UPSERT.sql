-- 77 TEAM MANAGER - SUPABASE MIGRAÇÃO V3
-- Corrige UPSERT por legacy_id

drop index if exists public.characters_legacy_id_unique;
create unique index if not exists characters_legacy_id_unique
on public.characters(legacy_id);

drop index if exists public.attendance_legacy_id_unique;
create unique index if not exists attendance_legacy_id_unique
on public.attendance(legacy_id);

drop index if exists public.payments_legacy_id_unique;
create unique index if not exists payments_legacy_id_unique
on public.payments(legacy_id);

drop index if exists public.events_legacy_id_unique;
create unique index if not exists events_legacy_id_unique
on public.events(legacy_id);

notify pgrst, 'reload schema';

select
  (select count(*) from public.characters) as characters,
  (select count(*) from public.attendance) as attendance,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.events) as events;
