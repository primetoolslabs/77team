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
