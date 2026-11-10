-- Record important school-data mutations in an immutable, metadata-only audit trail.
-- Field names and resource identifiers are captured; student/guardian values are not copied.

create or replace function private.write_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_actor uuid;
  v_resource_id text;
  v_changed_fields text[];
begin
  v_actor := auth.uid();

  if tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_row := v_old;
  else
    v_new := to_jsonb(new);
    v_row := v_new;
    if tg_op = 'UPDATE' then
      v_old := to_jsonb(old);
    end if;
  end if;

  v_resource_id := coalesce(
    v_row ->> 'id',
    v_row ->> 'user_id',
    v_row ->> 'student_id',
    v_row ->> 'session_id'
  );

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(n.key order by n.key), array[]::text[])
      into v_changed_fields
      from jsonb_each(v_new) as n
      left join jsonb_each(v_old) as o using (key)
      where n.value is distinct from o.value;
  elsif tg_op = 'INSERT' then
    select coalesce(array_agg(k.key order by k.key), array[]::text[])
      into v_changed_fields
      from jsonb_object_keys(v_new) as k(key);
  else
    select coalesce(array_agg(k.key order by k.key), array[]::text[])
      into v_changed_fields
      from jsonb_object_keys(v_old) as k(key);
  end if;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (
    v_actor,
    lower(tg_op),
    tg_table_name,
    v_resource_id,
    jsonb_build_object(
      'changed_fields', to_jsonb(v_changed_fields),
      'schema', tg_table_schema
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.write_audit_event() from public, anon, authenticated;

-- Audit logs are append-only from the application perspective. Trigger execution
-- uses the function owner's privileges; authenticated clients cannot forge entries.
drop policy if exists audit_logs_insert_actor on public.audit_logs;
revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles',
    'user_roles',
    'classes',
    'students',
    'teachers',
    'subjects',
    'teaching_assignments',
    'enrollments',
    'student_guardians',
    'attendance_sessions',
    'attendance_records',
    'assignments',
    'submissions',
    'grades',
    'announcements',
    'notifications',
    'leave_requests',
    'fee_invoices',
    'merit_points',
    'student_support_cases'
  ]
  loop
    execute format('drop trigger if exists audit_%I on public.%I', v_table, v_table);
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function private.write_audit_event()',
      v_table,
      v_table
    );
  end loop;
end;
$$;

comment on function private.write_audit_event() is
  'Writes metadata-only audit events for important school mutations; sensitive row values are not copied.';
