create table if not exists private.admin_password_setup_tokens (
  token_hash text primary key,
  email text not null check (lower(email) = 'sunuratperapon@gmail.com'),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now()
);

alter table private.admin_password_setup_tokens enable row level security;
revoke all on table private.admin_password_setup_tokens from public, anon, authenticated;

create or replace function public.claim_admin_password_setup(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_claimed boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rnmcom-admin-password-setup', 0)
  );

  select auth_user.id
    into v_user_id
  from auth.users as auth_user
  where pg_catalog.lower(auth_user.email) = 'sunuratperapon@gmail.com'
    and exists (
      select 1
      from public.user_roles as user_role
      where user_role.user_id = auth_user.id
        and user_role.role = 'admin'::public.app_role
    );

  if v_user_id is null then
    return null;
  end if;

  update private.admin_password_setup_tokens as token
  set claimed_at = pg_catalog.now()
  where token.token_hash = p_token_hash
    and token.email = 'sunuratperapon@gmail.com'
    and token.expires_at > pg_catalog.now()
    and token.consumed_at is null
    and (
      token.claimed_at is null
      or token.claimed_at < pg_catalog.now() - interval '15 minutes'
    )
  returning true into v_claimed;

  if coalesce(v_claimed, false) then
    return v_user_id;
  end if;
  return null;
end;
$function$;

create or replace function public.complete_admin_password_setup(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_consumed boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rnmcom-admin-password-setup', 0)
  );

  update private.admin_password_setup_tokens as token
  set consumed_at = pg_catalog.now()
  where token.token_hash = p_token_hash
    and token.email = 'sunuratperapon@gmail.com'
    and token.claimed_at > pg_catalog.now() - interval '15 minutes'
    and token.expires_at > pg_catalog.now()
    and token.consumed_at is null
  returning true into v_consumed;

  return coalesce(v_consumed, false);
end;
$function$;

create or replace function public.release_admin_password_setup(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_released boolean := false;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rnmcom-admin-password-setup', 0)
  );

  update private.admin_password_setup_tokens as token
  set claimed_at = null
  where token.token_hash = p_token_hash
    and token.email = 'sunuratperapon@gmail.com'
    and token.consumed_at is null
  returning true into v_released;

  return coalesce(v_released, false);
end;
$function$;

revoke all on function public.claim_admin_password_setup(text) from public, anon, authenticated;
revoke all on function public.complete_admin_password_setup(text) from public, anon, authenticated;
revoke all on function public.release_admin_password_setup(text) from public, anon, authenticated;
grant execute on function public.claim_admin_password_setup(text) to service_role;
grant execute on function public.complete_admin_password_setup(text) to service_role;
grant execute on function public.release_admin_password_setup(text) to service_role;

comment on table private.admin_password_setup_tokens is
  'Single-use, expiring password setup tokens for the school-authorized first administrator.';
