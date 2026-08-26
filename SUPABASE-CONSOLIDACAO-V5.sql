-- ============================================================
-- 77 TEAM MANAGER - SUPABASE CONSOLIDAÇÃO V5
-- Execute no SQL Editor.
-- ============================================================

-- Vincula pagamentos antigos pelo nickname quando houver correspondência única.
update public.payments p
set character_id = c.id,
    updated_at = now()
from public.characters c
where p.character_id is null
  and c.active = true
  and lower(trim(c.nickname)) = lower(trim(p.nickname));

-- Permite excluir eventos a quem possui events_manage.
drop policy if exists "events_admin_delete" on public.events;
create policy "events_admin_delete"
on public.events
for delete
to authenticated
using (public.has_permission('events_manage'));

-- Pagamento: DEV/Staff/Liderança com payments_manage podem excluir.
drop policy if exists "payments_admin_delete" on public.payments;
create policy "payments_admin_delete"
on public.payments
for delete
to authenticated
using (public.has_permission('payments_manage'));

notify pgrst, 'reload schema';

select
  (select count(*) from public.characters) as characters,
  (select count(*) from public.attendance) as attendance,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.payments where character_id is null) as payments_without_character,
  (select count(*) from public.events) as events;
