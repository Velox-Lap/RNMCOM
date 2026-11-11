update private.admin_bootstrap_tokens
set token_hash='97fa5a5248cfe1dfcae0a064bc1ec0cc79cb663983440e70c0190a50410f0216',
    expires_at=now()+interval '7 days',
    claimed_at=null,claimed_email=null,consumed_at=null,created_at=now()
where token_hash='e70b62779444ed4e4310509f95e709f2efa144c149b2038c13f8af85b4835ca3';
do $$
begin
  if not exists(select 1 from private.admin_bootstrap_tokens where token_hash='97fa5a5248cfe1dfcae0a064bc1ec0cc79cb663983440e70c0190a50410f0216' and consumed_at is null and expires_at>now()) then
    raise exception 'First admin bootstrap token rotation failed';
  end if;
end; $$;