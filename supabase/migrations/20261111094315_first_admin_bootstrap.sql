begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_bootstrap_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_email text,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_bootstrap_claim_pair_check check ((claimed_at is null) = (claimed_email is null)),
  constraint admin_bootstrap_consumed_check check (consumed_at is null or claimed_at is not null)
);
revoke all on table private.admin_bootstrap_tokens from public, anon, authenticated, service_role;

create or replace function public.claim_first_admin_bootstrap(p_token_hash text,p_email text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rnmcom-first-admin-bootstrap',0));
  if exists(select 1 from public.user_roles where role='admin'::public.app_role) then return false; end if;
  update private.admin_bootstrap_tokens token
  set claimed_at=pg_catalog.now(),claimed_email=pg_catalog.lower(pg_catalog.btrim(p_email))
  where token.token_hash=p_token_hash and token.expires_at>pg_catalog.now() and token.consumed_at is null
    and (token.claimed_at is null or token.claimed_at<pg_catalog.now()-interval '20 minutes')
  returning true into v_claimed;
  return coalesce(v_claimed,false);
end; $$;
revoke all on function public.claim_first_admin_bootstrap(text,text) from public,anon,authenticated;
grant execute on function public.claim_first_admin_bootstrap(text,text) to service_role;

create or replace function public.release_first_admin_bootstrap(p_token_hash text,p_email text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_released boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rnmcom-first-admin-bootstrap',0));
  if exists(select 1 from public.user_roles where role='admin'::public.app_role) then return false; end if;
  update private.admin_bootstrap_tokens token set claimed_at=null,claimed_email=null
  where token.token_hash=p_token_hash and token.claimed_email=pg_catalog.lower(pg_catalog.btrim(p_email)) and token.consumed_at is null
  returning true into v_released;
  return coalesce(v_released,false);
end; $$;
revoke all on function public.release_first_admin_bootstrap(text,text) from public,anon,authenticated;
grant execute on function public.release_first_admin_bootstrap(text,text) to service_role;

create or replace function public.complete_first_admin_bootstrap(p_token_hash text,p_email text,p_user_id uuid,p_full_name text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_token_id text; v_auth_email text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rnmcom-first-admin-bootstrap',0));
  select token.token_hash into v_token_id from private.admin_bootstrap_tokens token
  where token.token_hash=p_token_hash and token.claimed_email=pg_catalog.lower(pg_catalog.btrim(p_email))
    and token.claimed_at>pg_catalog.now()-interval '20 minutes' and token.expires_at>pg_catalog.now()
    and token.consumed_at is null for update;
  if v_token_id is null then return false; end if;
  if exists(select 1 from public.user_roles where role='admin'::public.app_role) then return false; end if;
  select pg_catalog.lower(auth_user.email) into v_auth_email from auth.users auth_user where auth_user.id=p_user_id;
  if v_auth_email is null or v_auth_email<>pg_catalog.lower(pg_catalog.btrim(p_email)) then return false; end if;
  update public.profiles set full_name=pg_catalog.btrim(p_full_name),email=v_auth_email,updated_at=pg_catalog.now() where id=p_user_id;
  insert into public.user_roles(user_id,role,is_primary) values(p_user_id,'admin'::public.app_role,true);
  update private.admin_bootstrap_tokens set consumed_at=pg_catalog.now() where token_hash=v_token_id;
  return true;
end; $$;
revoke all on function public.complete_first_admin_bootstrap(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.complete_first_admin_bootstrap(text,text,uuid,text) to service_role;

do $$ begin
  if exists(select 1 from public.user_roles where role='admin'::public.app_role) then
    raise exception 'Admin already exists; first-admin bootstrap token was not created';
  end if;
end; $$;
insert into private.admin_bootstrap_tokens(token_hash,expires_at)
values('e70b62779444ed4e4310509f95e709f2efa144c149b2038c13f8af85b4835ca3',now()+interval '7 days');
commit;