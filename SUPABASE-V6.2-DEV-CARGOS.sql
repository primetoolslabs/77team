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
